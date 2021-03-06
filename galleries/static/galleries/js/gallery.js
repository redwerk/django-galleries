$(function(){

    var min_width = 16;
    var min_height = 9;
    if($("#gallery").length){
        var min_width = parseInt($("#gallery").data('aspect-ratio').split("/")[0])
        var min_height = parseInt($("#gallery").data('aspect-ratio').split("/")[1])
    }

    MIN_SIZE = [min_width, min_height]
    ASPECT_RATIO = min_width/min_height
    
    var gallery_select = $("#id_gallery")
    
    var GALLERY_ID =  gallery_select.val()
    
    var GALLERY_URL = '/admin/galleries/' + GALLERY_ID + '/images/';

    gallery_select.change(function(e) {
        // Switcing galleries
        var id = gallery_select.val()
        if (id != '') {
            GALLERY_ID =  id;
            GALLERY_URL = '/admin/galleries/' + GALLERY_ID + '/images/';
            Images.url = GALLERY_URL;
            window.Gallery = new GalleryView
            if(id){
                $("#upload").show();
            }
        }
    })
    
    
    /* alias away the sync method */
        Backbone._sync = Backbone.sync;

        /* define a new sync method */
        Backbone.sync = function(method, model, options) {
            //from django docs
              function getCookie(name) {
                  var cookieValue = null;
                  if (document.cookie && document.cookie != '') {
                      var cookies = document.cookie.split(';');
                      for (var i = 0; i < cookies.length; i++) {
                          var cookie = jQuery.trim(cookies[i]);
                          // Does this cookie string begin with the name we want?
                          if (cookie.substring(0, name.length + 1) == (name + '=')) {
                              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                              break;
                          }
                      }
                  }
                  return cookieValue;
              }
            /* only need a token for non-get requests */
            if (method == 'create' || method == 'update' || method == 'delete') {
                // CSRF token value is in an embedded meta tag 
                /*var csrf_token = $('input[name=csrfmiddlewaretoken]')[0].value;*/
                var csrf_token = getCookie('csrftoken');

                options.beforeSend = function(xhr){
                    xhr.setRequestHeader('X-CSRFToken', csrf_token);
                };
            }

            /* proxy the call to the old sync method */
            return Backbone._sync(method, model, options);
        };

    window.Gallery = Backbone.Model.extend()
    
    window.GalleryImage = Backbone.Model.extend()

    window.GalleryImages = Backbone.Collection.extend({
        model: GalleryImage,
        url: GALLERY_URL,

        parse: function(response) {
            return response.images
        },

        sync: function(method, model, options) {
            var that = this;
            var params = _.extend({
                type: 'GET',
                url: that.url,
                processData: false
            }, options);

            return $.ajax(params);
        }
        
    })
    
    // Add jcrop to every image
    // Add fancybox to images

    var fancyBoxCropper = function(a) {
        /*var img = $("img", a.element[0]);*/
        var img = $("img", a);
        var org_width = img.data('org-width');
        var org_height = img.data('org-height');
        id = img.data('id')

        image = Images.get(id)
        
        function handleSelect(c) {
            coordinates.x = c.x
            coordinates.y = c.y
            coordinates.x2 = c.x2
            coordinates.y2 = c.y2
            $('#w').val(parseInt(c.w));
            $('#h').val(parseInt(c.h));
        }

        var options = {
            /*aspectRatio: ASPECT_RATIO,
            minSize: MIN_SIZE,*/
            trueSize: [org_width, org_height],
            allowMove: true,
            onSelect: handleSelect,
            onChange: handleSelect,
        }
        
        // If there are cropping, set initial crop
        var cropping = image.get("cropping")
        if (cropping != '') {
            var s = cropping.split(',');
            var initial = [
                parseInt(s[0], 10),
                parseInt(s[1], 10),
                parseInt(s[2], 10),
                parseInt(s[3], 10)
            ]
            $.extend(options, {setSelect: initial});
        }

        $(".fancybox-image").Jcrop(options)

    }

    function saveCroppingValue(id) {
        // Save the coordinates on the GalleryImage
        // First make it into a commaseperated list
        var cropping = []
        for (var i in coordinates) {
            cropping.push(parseInt(coordinates[i]))
        }
        cropping = cropping.toString()
        
        // Find the GalleryImage
        // Should be able to do "this.model", but for some reason
        // this models always refer to the last initiated one.
        image = Images.get(id)
        image.set({
            cropping: cropping
        })
        // Update cropping value on image
        image.save({}, {
            silent: true,
            success: function (model, response) {
                model.set({thumbnail: response.image.thumbnail}, {silent: true})
                model.change()
            }
        })
    }

    // Initiate the GalleryImages collection
    window.Images = new GalleryImages;
    
    window.ImageView = Backbone.View.extend({
        
        
        tagName: "li",
        
        template: _.template('<li class="image"><a rel="fancybox-button" href="<%= croppable %>" title="<%= title %>"> <img data-id="<%= id %>" data-org-width="<%= org_width %>" data-org-height="<%= org_height %>" src="<%= thumbnail %>"></a></li>'),
        
        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },
        
        render: function() {
            var model = this.model
            
            var html = this.template(this.model.toJSON())
            $(this.el).html(html)
            

            $("a", this.el).fancybox({
                helpers     : {
                    title   : { type : 'outer' },
                    buttons : {},
                },
                afterShow: function(){
                    var img = $("img", this.element[0]);
                    var org_width = img.data('org-width');
                    var org_height = img.data('org-height');
                    id = img.data('id')

                    image = Images.get(id)
                    
                    function handleSelect(c) {
                        coordinates.x = c.x
                        coordinates.y = c.y
                        coordinates.x2 = c.x2
                        coordinates.y2 = c.y2
                        $('#w').val(parseInt(c.w));
                        $('#h').val(parseInt(c.h));
                    }

                    var options = {
                        /*aspectRatio: ASPECT_RATIO,
                        minSize: MIN_SIZE,*/
                        trueSize: [org_width, org_height],
                        allowMove: true,
                        onSelect: handleSelect,
                        onChange: handleSelect,

                    }
                    
                    // If there are cropping, set initial crop
                    var cropping = image.get("cropping")
                    if (cropping != '') {
                        var s = cropping.split(',');
                        var initial = [
                            parseInt(s[0], 10),
                            parseInt(s[1], 10),
                            parseInt(s[2], 10),
                            parseInt(s[3], 10)
                        ]
                        $.extend(options, {setSelect: initial});
                    }

                    $(".fancybox-image").Jcrop(options)

                    this.inner.after('<div style="display: block; "><table id="fancybox-title-float-wrap" style="border: medium none; width: 100%;" cellpadding="0" cellspacing="0"><tbody><tr><td><label>W <input maxlength="4" size="4" id="w" name="w" type="text" readonly></label><label> H <input maxlength="4" size="4" id="h" name="h" type="text" readonly></label> <div class="fancybox-title fancybox-title-float-wrap" style="position: relative; width: 25%; display: inline;right: -8%;"><input type="button" class="child" style="border:none;" value="Save Cropping" onclick="saveCropping('+id+');"></div></td></tr></tbody></table></div>');
                    
                    $('#w').val(parseInt(s[2]-s[0]));
                    $('#h').val(parseInt(s[3]-s[1]));
                },
            })

            coordinates = new Object
            id = undefined

            window.saveCropping = function(id) {
              $.fancybox.close()
              saveCroppingValue(id)
            }
            
            
            // Add delete option on hover
            $(this.el).mouseenter(function() {
              $(this).append(
                $('<a />', {
                  'text': 'Clear',
                  'href': 'javascript:;',
                  'class': 'deleteBtn fancybox-item'
                }).click(function(e) {
                  console.log("DELETE IMAGE")
                  model.destroy()
                })
              )
            })
            $(this.el).mouseleave(function() {
              $('.deleteBtn', this).remove()
            })



            return this
        },
        
        remove: function() {
            $(this.el).remove()
        },
        
        clear: function() {
            this.model.destroy()
        }
        
    })
    
    window.GalleryView = Backbone.View.extend({

        el: "#gallery",
        
        events: {
            "change input[type=file]": "upload",
        },
        
        initialize: function() {
            Images.bind('add', this.addOne, this)
            Images.bind('reset', this.addAll, this)
            Images.fetch({
                type: "GET",
                contentType: 'text/html',
                success: function () {
                    console.log('Fetching images with success');
                },error: function () {
                    console.log('Error when fetching images');
                }
        })
            
            // Make list sortable
            $("ul", this.el).sortable({
                update: function(event, ui) {
                    // Get the image that has moved
                    //var id = $("img", ui.item).data('id')
                    //var image = Images.get(id)
                    
                    // Loop through all images, and update their order attribute
                    var images = $(this).find("img")
                    images.each(function(i) {
                        var image = Images.get($(this).data("id"))
                        image.set({ order: i+1 })
                        image.save()
                    })
                    
                }
            })
            
            // Add drop event handler for uploadin
            $("#upload").dropArea().bind("drop", this.drop)

            // Rearrange position of the "add button"
            $("#add_id_gallery").prependTo($("#add_id_gallery").parent())
            $("#id_gallery").prependTo($("#id_gallery").parent())
            /*$("#add_id_gallery").remove()
            if(!$('#lookup_id_gallery').length){
                $('#id_gallery').after('<a href="/admin/galleries/gallery/?_to_field=id" class="related-lookup" id="lookup_id_gallery" onclick="return showRelatedObjectLookupPopup(this);"><img src="/static/admin/img/selector-search.gif" alt="Lookup" width="16" height="16"></a>')
            }*/
        },
        
        addOne: function(image) {
            var view = new ImageView({model: image})
            $("ul", "#gallery").append(view.render().el)
        },
        
        addAll: function() {
            // Clear images already present
            $("ul", "#gallery").html('')
            Images.each(this.addOne);
        },
        
        drop: function(e) {
            e.stopPropagation()
            e.preventDefault()
            e = e.originalEvent
            
            var csrf_token = $('input[name=csrfmiddlewaretoken]')[0].value;

            files = e.dataTransfer.files
            for (var i in files) {
                if ( typeof files[i] == "object" ) {
                    var file = files[i]
                    uploadDrop(file)
                }
            }
            
            function uploadDrop(file) {
                $.upload(GALLERY_URL, {
                    image: file,
                    gallery: GALLERY_ID,
                    csrfmiddlewaretoken: csrf_token
                }, function(data) {
                    var image = new GalleryImage(data.image) 
                    Images.add(image)
                })
            }
        },
    
        upload: function(e) {
            var csrf_token = $('input[name=csrfmiddlewaretoken]')[0].value;
            var _URL = window.URL || window.webkitURL;
            var target = e.currentTarget

            /*var acceptableSize = function(w,h){
                return (w > REQUIRED_WIDTH -5) && (w < REQUIRED_WIDTH +5) && (h > REQUIRED_HEIGHT -5) && (h < REQUIRED_HEIGHT +5);
            }*/
            var uploadFile = function(file){
                $.upload(GALLERY_URL, {
                    image: file,
                    gallery: GALLERY_ID,
                    csrfmiddlewaretoken: csrf_token
                }  
                , function(data) {
                    var image = new GalleryImage(data.image) 
                    Images.add(image)
                })
            }
            _.each(target.files, function(file) {
                /*var img = new Image();
                img.onload = function() {
                    if (typeof REQUIRED_WIDTH === 'undefined') {
                        uploadFile(file)
                    }else{
                        if(!acceptableSize(this.width,this.height)){
                            alert("The image '"+file.name+"' is "+ this.width + "x" + this.height+" \n\nOnly ("+ REQUIRED_WIDTH + "x" + REQUIRED_HEIGHT + " ±5px) images are acceptable");
                        }
                    }
                };
                img.onerror = function() {
                    alert( "Not a valid file: " + file.type);
                };
                img.src = _URL.createObjectURL(file);*/
                uploadFile(file);
            })

            e.stopPropagation()
            e.preventDefault()
            return false
        },
        
    })
    
    window.Gallery = new GalleryView
})