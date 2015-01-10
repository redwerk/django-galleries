from django.conf import settings
from django.contrib import admin
from django.forms.widgets import HiddenInput
from orderable.admin import OrderableTabularInline

from models import Gallery, Image


class SortableMixin(object):
	sortable_field_name = "sort_order"

	def formfield_for_dbfield(self, db_field, **kwargs):
		if 'grappelli' in settings.INSTALLED_APPS:
			if db_field.name == self.sortable_field_name:
				kwargs["widget"] = HiddenInput()
		return super(SortableMixin, self).formfield_for_dbfield(db_field, **kwargs)


class ImageInline(SortableMixin, OrderableTabularInline):
	model = Image
	extra = 0


class GalleryAdmin(admin.ModelAdmin):
	inlines = [
		ImageInline
	]

admin.site.register(Gallery, GalleryAdmin)
