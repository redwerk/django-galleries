from django.db import models

from widgets import GalleryForeignKeyWidget


class GalleryForeignKey(models.ForeignKey):
    """
    A field that references a Gallary, this will only work in the admin cause
    it leverages the raw_id widget.
    """

    def formfield(self, *args, **kwargs):
        kwargs['widget'] = GalleryForeignKeyWidget(self.rel, using=kwargs.get('using'))
        # kwargs['widget'] = GalleryForeignKeyWidget(self.rel,  *args, **kwargs)
        print kwargs['widget']
        return super(GalleryForeignKey, self).formfield(*args, **kwargs)
