var App;
$(function() {

  var _id = 0;

  var SIZE = 200;
  var SPACING = 20;
  var ROWCOUNT = 4;

  var currentType;

  Vue.component('image-item', {
    template: "#image-item",
    props: [
      'src', 'width', 'height', 'count', 'order', '_id', 'type', 'uploading', 'progress', 'busy'
    ],
    data: function() {
      return {
        dragging: false,
        fly: false,
        rotate: 0
      }
    },
    computed: {
      imgStyle: function() {

        var width, height, marginTop, marginLeft;

        if (this.width < this.height) {
          height = SIZE;
          width = SIZE / this.height * this.width;
          marginLeft = (SIZE - width ) / 2;
          marginTop = 0;
        } else {
          height = SIZE / this.width * this.height;
          width = SIZE;
          marginTop = (SIZE - height) / 2;
          marginLeft = 0;
        }

        return {
          width: width + 'px',
          height: height + 'px',
          marginTop: marginTop + 'px',
          marginLeft: marginLeft + 'px',
        };

      },
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
      },
      progressWidth: function() {
        return this.progress * (SIZE - 20) + 'px';
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
      rotateLeft: function(index) {
        this.$emit('rotate', index, 1);
      },
      rotateRight: function(index) {
        this.$emit('rotate', index, -1);
      },
      remove: function(index) {

        $(this.$el).addClass('removed');

        setTimeout(function() {
          this.$emit('remove', index);
        }.bind(this), 300);

      }
    }
  });

  Vue.component('image-placeholder', {
    template: '#image-placeholder'
  })

  App = new Vue({
    el: "#app",
    template: "#images-app-template",
    data: {
      images: [],
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
      addImage: function(props) {

        var newImg = {
          id: ++_id
        };

        for (var p in props) {
          newImg[p] = props[p];
        }

        this.images.push(newImg);

        return _id;

      },
      updateImage: function(id, props) {

        var index;

        for (var i = 0; i < this.images.length; i++) {
          if (this.images[i].id == id) {
            for (var p in props) {
              index = i;
              this.images[i][p] = props[p];
            }
            break;
          }
        }

      },
      addHandler: function(type) {

        var form = $('#input_form').first();

        var inp = $('#input_file').first();
        inp.val('');

        inp.click();

        if (currentType && currentType != type) {
          inp.off('change.input_file');
        }

        currentType = type;

        inp.on('change.input_file', function(_inp, _type) {

            var inp = _inp;
            var type = _type;

            return function() {

              var files = inp[0].files;

              for (var i = 0; i < files.length; i++) {

                var nameParts = files[i].name.split('.');

                if (type == 'picture' && nameParts[nameParts.length-1].toLowerCase() != 'jpg' && nameParts[nameParts.length-1].toLowerCase() != 'jpeg') {
                  continue;
                } else if (type == 'video' && nameParts[nameParts.length-1].toLowerCase() != 'mp4') {
                  continue;
                }


                var data = new FormData();
                data.append('file', files[i]);
                data.append('type', type);

                var id = this.addImage({
                  type: type,
                  uploading: true,
                  progress: 0,
                  src: null,
                  width: 0,
                  height: 0,
                  orig: null,
                  rotate: 0,
                  busy: true
                });

                $.ajax({
                  url: form.attr('action'),
                  type: 'POST',

                  data: data,

                  cache: false,
                  contentType: false,
                  processData: false,

                  xhr: function(id) {

                    return function() {
                      var xhr = new XMLHttpRequest();
                      xhr.upload.addEventListener('progress', function(event) {
                        if (event.lengthComputable) {
                          var progress = event.loaded / event.total;
                          this.updateImage(id, {
                            progress: progress,
                            uploading: event.loaded != event.total
                          });
                        }
                      }.bind(this));
                      return xhr;
                    }.bind(this);

                  }.bind(this)(id),

                  success: function(id) {

                    return function(data, status, xhr) {

                      var obj = JSON.parse(data);

                      var tmp = {
                        progress: 1,
                        uploading: false
                      }

                      tmp.src = obj.upload.info.path + '?' + (new Date()).getTime();

                      if (obj.upload.type == 'picture') {

                        tmp.width = obj.upload.info.width;
                        tmp.height = obj.upload.info.height;

                        var hiddenImage = new Image();
                        hiddenImage.src = tmp.src;
                        $(hiddenImage).on('load', function() {
                            this.updateImage(id, {
                              busy: false
                            });
                        }.bind(this));

                      } else {
                        tmp.busy = false;
                      }

                      tmp.orig = obj.upload.info.orig;

                      this.updateImage(id, tmp);

                    }.bind(this);

                  }.bind(this)(id)

                });

              }

              inp.off('change.input_file');
              inp.val('');

            }.bind(this);

        }.bind(this)(inp, type));

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
      },
      rotateHandler: function(index, rotateDirection) {

        this.images[index].rotate += rotateDirection * 90;

        var srcBase = this.images[index].src.split('?')[0];

        $.ajax({
          url: '/rotate.php',
          type: 'POST',

          data: {
            type: this.images[index].type,
            src: this.images[index].src.split('?')[0],
            rotate: rotateDirection * 90,
          },

          beforeSend: function(){

            this.images[index].src = null;
            this.images[index].busy = true;

          }.bind(this),

          success: function(id, type) {

            return function(data, status, xhr) {

              if (data.length == 0) {
                return;
              }

              var response = JSON.parse(data);

              var tmp = {
                src: srcBase + '?' + (new Date()).getTime()
              };

              if (type == 'picture') {

                tmp.width = response.width;
                tmp.height = response.height;

                var hiddenImage = new Image();
                hiddenImage.src = tmp.src;
                $(hiddenImage).on('load', function() {
                  this.updateImage(id, {
                    busy: false
                  });
                }.bind(this));

              } else {

                tmp.busy = false;

              }

              this.updateImage(id, tmp);

            }.bind(this);

          }.bind(this)(this.images[index].id, this.images[index].type)

        });

      },

      removeHandler: function(index) {
        this.images.splice(index, 1);
      }

    }
  });

});
