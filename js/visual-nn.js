// root SVG
var svg = d3.select('#svg').append('svg');
var width = 1000, height = 270;
svg.attr('width', width).attr('height', height);

d3.selection.prototype.moveToFront = function() {  
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

d3.selection.prototype.moveToBack = function() {  
	return this.each(function() { 
		var firstChild = this.parentNode.firstChild; 
		if (firstChild) { 
			this.parentNode.insertBefore(this, firstChild); 
		} 
	});
};


class VisualNN {
	constructor(message, selection, height, width) {
		this.em = selection.append('g');

		this.height = height || 200;
		this.width = width || 250;
		this.radius = this.width / (8 * (1 + 1.1618033));
		this.scale = 1.5;
		this.border = 2; 

		this.letters = d3.shuffle(message);
		this.run();
	}

	bin(n) {
		var arr = [];
		for(var i=0;i<8;i++) {
			var b = n % 2;
			n = parseInt(n / 2);
			arr.push(b);	
		}
		return arr.reverse();
	}

	sigmoid(x) {
		// 1 / (1 + e^-x) 
		return math.dotDivide(
				1, math.add(1,math.exp(math.multiply(-1,x))));
	}

	sigmoid_derivative(x) {
		// x * (1-x)
		return math.dotMultiply(x,math.subtract(1,x));
	}

	/* SIMPLE ONE LAYER NEURAL NET */
	//	Takes a random 8 bit array and learns the weights required to output 
	//	the correct character (as a binary array) from the input.
	//	Of course this will overfit.

	train(ch) {
		var activation = this.sigmoid;
		var derivative = this.sigmoid_derivative;

		var output = this.bin(ch.charCodeAt(0))
		var X_train = math.matrix([math.random([8], .1, .9)]);
		var y_train = math.matrix([output]);

		var weights = math.matrix([math.random([8])]);
		var epochs = 300;

		for(var i=0;i<epochs;i++) {
			var hidden = activation(math.dotMultiply(X_train, weights));
			var loss = math.subtract(y_train, hidden);
			var delta = math.dotMultiply(loss, derivative(hidden));
			weights = math.add(weights, math.dotMultiply(X_train, delta));
		}

		this.hidden = math.round(hidden,1).toArray()[0];
		this.X = math.round(X_train,1).toArray()[0];
		this.y = math.round(y_train,1).toArray()[0];

		this.em.selectAll('*').remove()
		this.draw();		
	}

	async run() {
		if(this.letters.length > 0) {
			var data = this.letters.pop();
			// skip spaces
			if(data.ch != ' ') {
				this.ch_index = data.pos;
				this.train(data.ch);
				await this.sleep(math.randomInt(100,200));
			}
			this.run()
		}
	}

	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	draw() {
		var s = this.scale;
		var w = this.width;
		var h = this.height;
		var r = this.radius
		var ch_index = this.ch_index;

		var x = d3.scaleLinear()
		.domain([0, 8-1]) 
		.range([this.radius, this.width - this.radius]);

		var layer_coords = d3.range(8).map(function(i) { return {
			source: {x: x(i), y: h/3},
			target: {x: x(i), y: h-h/3}
		}});

		var line_weight = d3.scaleLinear()
			.domain([0, 1]) 
			.range([5,12]);
		// .range([5,2*this.radius-2*this.border]);

		var link = d3.linkVertical()
			.x(function(d) { return d.x })
			.y(function(d) { return d.y });

		// draw weighted lines for hidden layer
		this.em.selectAll()
			.data(layer_coords)
			.enter()
			.append('path')
			.attr('d', link)
			.attr('class','hidden-weight-lines')
			.data(this.hidden)
			.style('stroke-width', 5)
			.style('stroke-width', function(d) {return line_weight(d)})

		// draw input / output weighted lines
		// input
		var input_coords = d3.range(8).map(function(i) { return {
			source: {x: w/2, y: s*r},
			target: {x: x(i), y: h/3}
		}});

		this.em.selectAll()
			.data(input_coords)
			.enter()
			.append('path')
			.attr('d', link)
			.attr('class','hidden-weight-lines')
			.data(math.round(this.X))
			.style('stroke-width', 5)
			.style('stroke-width', function(d) {return line_weight(d)});

		// output
		var output_coords = d3.range(8).map(function(i) { return {
			source: {x: w/2, y: h-s*r},
			target: {x: x(i), y: h-h/3}
		}});

		this.em.selectAll()
			.data(output_coords)
			.enter()
			.append('path')
			.attr('d', link)
			.attr('class','hidden-weight-lines')
			.data(this.y)
			.style('stroke-width', function(d) {return line_weight(d)})

		// draw layer nodes
		//input layer
		this.em.selectAll()
			.data(d3.range(8))
			.enter()
			.append('circle')
			.attr('cx', function(d) {return x(d)})
			.attr('cy', h/3)
			.attr('r', this.radius-this.border)

		// output layer
		this.em.selectAll()
			.data(d3.range(8))
			.enter()
			.append('circle')
			.attr('cx', function(d) {return x(d)})
			.attr('cy', h-h/3)
			.attr('r', this.radius-this.border)

		//input value
		this.em.selectAll()
			.data([1])
			.enter()
			.append('circle')
			.attr('cx', w/2)
			.attr('cy', s*r)
			.attr('r', s*this.radius-this.border)

		// output value
		this.em.selectAll()
			.data([1])
			.enter()
			.append('circle')
			.attr('cx', w/2)
			.attr('cy', h-s*r)
			.attr('r', s*this.radius-this.border)

		// draw overlay lines for hidden layer
		this.em.selectAll()
			.data(layer_coords)
			.enter()
			.append('path')
			.attr('d', link)

		// overlay for input
		var input_coords = d3.range(8).map(function(i) { return {
				source: {x: w/2, y: s*r},
				target: {x: x(i), y: h/3}
			}});

		this.em.selectAll()
			.data(input_coords)
			.enter()
			.append('path')
			.attr('d', link)
			.attr('class','thin-line')

		// overlay for input
		var input_coords = d3.range(8).map(function(i) { return {
				source: {x: w/2, y: h-s*r},
				target: {x: x(i), y: h-h/3}
			}});

		this.em.selectAll()
			.data(input_coords)
			.enter()
			.append('path')
			.attr('d', link)
			.attr('class','thin-line')

		// dot product lines
		var dot_coords = [];
		for(var i=0;i<8;i++) {
			for(var j=0;j<8;j++) {
				dot_coords.push({
					source: {x: x(i), y: h/3},
					target: {x: x(j), y: h-h/3}
				});
			}
		}
		this.em.selectAll()
			.data(dot_coords)
			.enter()
			.append('path')
			.attr('d', link)
			.attr('class','dot-lines')
			.moveToBack()

		// lables
		//input layer
		this.em.selectAll()
			.data(d3.range(8))
			.enter()
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'central')
			.attr('class', 'layer-label')
			.attr('x', function(d) {return x(d)})
			.attr('y', h/3)
			.data(this.X)
			.text(function(d) { return d})

		// output layer
		this.em.selectAll()
			.data(d3.range(8))
			.enter()
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'central')
			.attr('class', 'layer-label')
			.attr('x', function(d) {return x(d)})
			.attr('y', h-h/3)
			.data(this.hidden)
			.text(function(d) { return d})

		//input value
		this.em.selectAll()
			.data([1])
			.enter()
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'central')
			.attr('x', w/2)
			.attr('y', s*r)
			.text(String.fromCharCode(
						parseInt(math.round(this.X).join(''),2)))

		// output value
		this.em.selectAll()
			.data([1])
			.enter()
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'central')
			.attr('x', w/2)
			.attr('y', h-s*r)
			.text(String.fromCharCode(
						parseInt(math.round(this.hidden).join(''),2)))

		// chacter box / line
		var label = d3.select('#letter-'+ch_index);
		label.text(String.fromCharCode(
					parseInt(math.round(this.hidden).join(''),2)))

		var trans = this.em.attr('transform');
		if(trans) { 
			var _x = 34+ch_index*28 - this.get_trans_x(trans)
			var _y = 230;
			var label_coords = [{
				source: {x:w/2, y:h-s*r},
				target: {x:_x, y:_y}
			}]

			this.em.selectAll()
				.data(label_coords)
				.enter()
				.append('path')
				.attr('d', link)
				.attr('class','thin-lines')
				.moveToBack()

			this.em.selectAll()
				.data([1])
				.enter()
				.append('rect')
				.attr('x', _x-28/2)
				.attr('y', _y)
				.attr('width', 28)
				.attr('height', 40)
		}
	}

	get_trans_x(transform) {
		var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		g.setAttributeNS(null, 'transform', transform);
		var matrix = g.transform.baseVal.consolidate().matrix;
		return matrix.e;
	}

}

// final text
svg.selectAll()
	.data(d3.range(34))
	.enter()
		.append('text')
		.attr('x', function(d) { return 34+d*28 })
		.attr('y', 250)
		.attr('id', function(d) {return 'letter-'+d})
		.attr('text-anchor', 'middle')
		.attr('alignment-baseline', 'central')
		.style('font-size', 32)
		.text(' ').moveToFront()

var message = 'Things I have been thinking about.';

while(message.length % 4 != 0) {
	message += ' ';
}

var letters = [d3.range(message.length).map(function(i) {
	return {pos:i, ch:message[i]}
})];

letters = math.reshape(letters, [4, message.length/4]);

for(var i=0;i<4;i++) {
	var net = new VisualNN(letters[i], svg);
	net.em.attr('transform', 'translate('+ 250 * i+',0)');
}
