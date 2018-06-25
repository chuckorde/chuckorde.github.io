
var Gelicious = {

	objects: [],
	pages: 1,
	freezestop: true,
	width: window.innerWidth,
	height: window.innerHeight,

	actions: {
		move: function () {
			var x = Gelicious.map (this, 'x');
			var y = Gelicious.map (this, 'y');

			this.element.style.position = this.position || 'absolute';
			this.element.style.left = x;
			this.element.style.top = y;
		},

		scale: function() {
			var w = Gelicious.map (this, 'width');
			var h = Gelicious.map (this, 'height');

			this.element.style.width = w;
			this.element.style.height = h;
		},

		rotate: function () {
			var angle = Gelicious.map (this, 'angle');
			this.direction = this.direction || 1;
			angle = angle * this.direction;

			this.element.style.webkitTransform = 'rotate('+angle+'deg)'; 
			this.element.style.mozTransform = 'rotate('+angle+'deg)'; 
			this.element.style.msTransform = 'rotate('+angle+'deg)'; 
			this.element.style.oTransform = 'rotate('+angle+'deg)'; 
			this.element.style.transform = 'rotate('+angle+'deg)'; 
		},

		fade: function () {
			var o = Gelicious.map (this, 'opacity');
			o /= 100;
			this.element.style.opacity = o;
			this.element.style.filter = 'alpha(opacity=' + o + ')';
		}
	},

	map: function (o, v){
		var min = o.start[v];
		var max = o.stop[v];
		var scale = o.speed / this.pages;
		var stepmax = scale * o.page;
		var stepmin = scale * o.page - scale;
		if (this.step < stepmin && o.freezestart) return;
		if (this.step > stepmax && o.freezestop) {
			if(o.callback) {
				o.callback();
				o.callback = null;
			}
			return max; 
		}
		else return (((this.step - stepmin) * (max - min)) / 
			   		(stepmax - stepmin)) + min;
	},

	add: function (props) {
		props.update = this.actions[props.action];
		props.id = props.element;
		props.element = document.getElementById (props.element);
		props.page = props.page || 1;
		props.speed = 1/props.speed || 1/this.speed || 1;
		props.freezestop = (props.freezestop == undefined) ? 
			this.freezestop : props.freezestop;
		props.callback = props.callback || null;

		if (props.css) {
			for (k in props.css){
				if (props.element.style)
					props.element.style[k] = props.css[k]; 
			}
		}
		this.objects.push (props);
		this.update(0);
	},

	remove: function (id, remove_element){
		if (remove_element){
			var el = document.getElementById(id);
			if (el) el.parentNode.removeChild(document.getElementById(id))
		}
		for (var i=0; i<this.objects.length; i++) {
			if (this.objects[i].id == id){
				this.objects.splice(i, 1)
			}
		}
	},

	update: function (step) {
		this.step = step;
		for (var obj in this.objects){
			this.objects[obj].update()
		}
	},

	get: function(id) { 
		for (var i=0; i<this.objects.length; i++) {
			if (this.objects[i].id == id){
				return this.objects[i]	
			}
		}
	},
}


