var App;
$(function() {

  var SIZE = 100;
  var SPACING = 10;
  var ROWCOUNT = 10;

  Vue.component('image-item', {
    template: "#image-item",
    props: [
      'src', 'width', 'height', 'count', 'order', '_id'
    ],
    data: function() {

      var width, height, marginTop, marginLeft;

      if (this.width < this.height) {
        height = SIZE;
        width = SIZE / this.height * this.width;
        marginLeft = (SIZE - width ) / 2;
      } else {
        height = SIZE / this.width * this.height;
        width = SIZE;
        marginTop = (SIZE - height) / 2;
      }

      return {
        imgStyle: {
          width: width + 'px',
          height: height + 'px',
          marginTop: marginTop + 'px',
          marginLeft: marginLeft + 'px',
        },
        dragging: false,
        fly: false,
        shiftX: 0,
        shiftY: 0,
      }
    },
    computed: {
      componentStyle: function() {
        var position = this.getPosition();
        return !this.dragging ? {
          left: position.left + 'px',
          top: position.top + 'px',
          zIndex: !this.fly ? 2 : 3,
        } : {
          zIndex: 4,
        }
      },
      parentOffset: function() {
        var parentOffset = $(this.$el).parent().offset();
        return {
          left: parentOffset.left + 1,
          top: parentOffset.top + 1
        }
      }
    },
    methods: {
      /** TODO Probaby this method should be moved to computed */
      getPosition: function() {
        var col = this.order % ROWCOUNT;
        var row = Math.floor(this.order / ROWCOUNT);
        var left = col * (SIZE + SPACING) + SPACING;
        var top = row * (SIZE + SPACING) + SPACING;
        return {
          col: col,
          row: row,
          left: left,
          top: top
        }
      },
      setPositionFromEvent: function(event) {
        var left = event.pageX - this.parentOffset.left - SIZE / 2;
        var top = event.pageY - this.parentOffset.top - SIZE / 2;
        $(this.$el).css({
          left: left + 'px',
          top: top + 'px',
        });
      },
      mouseDownHandler: function(event) {
        if (event.button != 0) {
          return;
        }
        this.startDragging();
        this.$nextTick(function() {
          this.setPositionFromEvent(event);
        });
      },
      mouseMoveHandler: function(event) {
        this.setPositionFromEvent(event);

        var mousePosX = event.pageX - this.parentOffset.left - SPACING/2;
        var mousePosY = event.pageY - this.parentOffset.top - SPACING/2;

        var newPosition = {}, newOrder, rows, columns;

        rows = Math.ceil(this.count / ROWCOUNT);
        newPosition.row = Math.floor((mousePosY - mousePosY % (SIZE + SPACING))/(SIZE+SPACING));
        newPosition.row = newPosition.row < rows ? newPosition.row : rows - 1;

        columns = newPosition.row == rows - 1 ? this.count - (rows-1)*ROWCOUNT : ROWCOUNT;
        newPosition.col = Math.floor((mousePosX - mousePosX % (SIZE + SPACING))/(SIZE+SPACING));
        newPosition.col = newPosition.col < columns ? newPosition.col : columns - 1;

        newOrder = (newPosition.row) * ROWCOUNT + newPosition.col;
        this.$emit('moving', this._id, newOrder);

      },
      mouseUpHandler: function(event) {
        this.endDragging();
        $(window).off('mousemove.imagesLayout');
        $(window).off('mouseup.imagesLayout');
      },
      startDragging: function() {
        this.dragging = true;
        $(window)
        /* For some reason this works without bind(this) */
        .on('mousemove.imagesLayout', this.mouseMoveHandler)
        .on('mouseup.imagesLayout', this.mouseUpHandler);
        this.$emit('changedragging', this.order);
      },
      endDragging: function() {
        this.dragging = false;
        this.fly = true;
        this.$emit('changedragging');
        setTimeout(function() {
          this.fly = false;
        }.bind(this), 500);
      },
    }
  });

  Vue.component('image-placeholder', {
    template: '#image-placeholder'
  })

  App = new Vue({
    el: "#app",
    data: {
      images: [
        {
          id: 1,
          type: 'picture',
          src: 'upload/images/1.jpg',
          width: 1333,
          height: 1000
        },
        {
          id: 2,
          type: 'picture',
          src: 'upload/images/2.jpg',
          width: 1502,
          height: 1000
        },
        {
          id: 3,
          type: 'picture',
          src: 'upload/images/3.jpg',
          width: 665,
          height: 1000
        },
        {
          id: 4,
          type: 'picture',
          src: 'upload/images/4.jpg',
          width: 1333,
          height: 1000
        },
      ],
      placeholderShown: false,
      placeholderX: 0,
      placeholderY: 0
    },
    computed: {
      containerHeight: function() {
        return (Math.ceil(this.images.length / ROWCOUNT)) * (SIZE + SPACING) - SPACING + 'px';
      }
    },
    methods: {
      addHandler: function(type) {
        console.log(type);
      },
      changeDraggingHander: function(dragging) {
        this.placeholderShown = typeof dragging != 'undefined';
        this.movePlaceholder(dragging);
      },
      imageItemMovingHandler: function(id, newOrder) {
        var order, item;
        for (var i = 0; i < this.images.length; i++) {
          if (this.images[i].id == id) {
            item = this.images[i];
            order = i;
            break;
          }
        }
        if (order == newOrder) {
          return;
        }
        if (typeof order != 'undefined') {
          this.images.splice(order, 1);
          this.images.splice(newOrder, 0, item);
          this.movePlaceholder(newOrder);
        }
      },
      movePlaceholder: function(index) {
        this.placeholderX = index % ROWCOUNT * (SIZE+SPACING) + SPACING;
        this.placeholderY = Math.floor(index/ROWCOUNT) * (SIZE+SPACING) + SPACING;
      }
    }
  });

});
