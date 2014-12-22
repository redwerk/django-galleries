from django.db import models

from widgets import GallerySelectWidget


class GalleryForeignKey(models.ForeignKey):
	"""
	A field that references a Gallary, this will only work in the admin cause
	it leverages the select widget.
	"""

	def formfield(self, *args, **kwargs):
		# kwargs['widget'] = GalleryForeignKeyWidget(self.rel, using=kwargs.get('using'))
		kwargs['widget'] = GallerySelectWidget()
		return super(GalleryForeignKey, self).formfield(*args, **kwargs)
