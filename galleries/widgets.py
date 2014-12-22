import logging

from django.db.models import get_model, ObjectDoesNotExist
from django.contrib.admin.widgets import ForeignKeyRawIdWidget, AdminRadioSelect
from django.forms.widgets import Select
from django.utils.safestring import mark_safe

from django.conf import settings

logger = logging.getLogger(__name__)

from galleries.settings import IMAGE_CROPPING_RATIO

ASPECT_RATIO = "/".join(IMAGE_CROPPING_RATIO.split("x"))


class GalleryWidget(object):
    """
    This widget is ment to be used with the GalleryField, this provides
    all the javascript and stylesheets that make the GalleryField work.
    """

    # class Media:
    #     js = (
    #         # getattr(settings, 'JQUERY_URL', 'https://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js'),
    #         # getattr(
    #         #     settings,
    #         #     'JQUERY_UI_URL', 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js'
    #         #     ),
    #         "galleries/lib/jquery-1.10.2.min.js",
    #         "galleries/lib/jquery-ui-1.10.2.min.js",
    #         "galleries/lib/Jcrop/js/jquery.Jcrop.min.js",
    #         "galleries/lib/json2.js",
    #         "galleries/lib/underscore-min.js",
    #         "galleries/lib/backbone-min.js",
    #         "galleries/lib/jquery.upload.js",
    #         "galleries/lib/jquery.drop.js",
    #         "galleries/lib/fancybox/jquery.fancybox.pack.js",
    #         "galleries/js/gallery.js",
    #     )
    #     css = {'all': (
    #         "galleries/lib/fancybox/jquery.fancybox.css",
    #         "galleries/lib/Jcrop/css/jquery.Jcrop.min.css",
    #         "galleries/css/gallery.css",
    #     )}


class GalleryForeignKeyWidget(ForeignKeyRawIdWidget):

    def __init__(self, *args, **kwargs):
        from django.contrib.admin.sites import site
        args += (site,)
        super(GalleryForeignKeyWidget, self).__init__(*args, **kwargs)

    def render(self, name, value, *args, **kwargs):

        output = [super(GalleryForeignKeyWidget, self).render(name, value, *args, **kwargs)]
        print output
        if value:
            output.append('<hr style="margin: 10px 0 10px 0;" />')
            output.append('<div data-aspect-ratio="%s" data-id="%s" id="gallery">' % (ASPECT_RATIO, value))
            output.append('<ul>')

            # Get model based on app name and model name
            app_name = self.rel.to._meta.app_label
            model_name = self.rel.to._meta.object_name.lower()
            try:
                gallery = get_model(app_name, model_name).objects.get(pk=value)
            except ObjectDoesNotExist:
                logger.error(
                    "Can't find object: %s.%s with primary key %s "
                    "for displaying gallery." % (app_name, model_name, value))

            # Add images
            for image in gallery.images.all():
                output.append('<li>')
                output.append('<a href="%s">' % image.croppable)
                output.append(
                    '<img data-id="%s" data-org-width="%s" data-org-height="%s" src="%s" />' % (image.id, image.image.width, image.image.height, image.thumbnail)
                    )
                output.append('</a>')
                output.append('</li>')

            output.append('</ul>')
            output.append('<div id="upload">')
            output.append('<form>')
            output.append('<input type="file" value="Choose file" multiple />')
            output.append('</form>')
            output.append('<p>Choose, or drop images here.</p>')
            output.append('</div>')
            output.append('</div>')

            return mark_safe(u''.join(output))

        else:
            return mark_safe(u''.join(output))
