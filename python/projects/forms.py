from PIL import Image

from django import forms
from django.forms.widgets import TextInput, Textarea

from .models import Folder, Item, Project

class FolderForm(forms.ModelForm):
    class Meta:
        model = Folder
        fields = ['title', 'colour']
        widgets = {
                   'colour': TextInput(attrs={'type': 'color'}),
                   }


class ItemForm(forms.ModelForm):

    amends = forms.IntegerField(initial=3, disabled=True)

    def __init__(self, *args, **kwargs):
        super(ItemForm, self).__init__(*args, **kwargs)
        if self.instance.id:
            folders = Folder.objects.filter(project_id=self.instance.project_id)
        else:
            folders = Folder.objects.filter(project_id=self.initial['project_id'])
        self.fields['folder'].queryset = folders

    class Meta:
        model = Item
        fields = fields = ['title', 'brief', 'kick_off', 'deadline', 'amends', 'file_format', 'dimensions', 'resolution', 'supplier_role', 'supplier_level', 'payment_method', 'currency', 'value', 'folder']

        widgets = {
                   'brief': Textarea(attrs={'placeholder': 'Enter your design brief here including purpose (eg. users or audience), as well as any details (e.g. size, references, constraints)'}),
                   }


class ProjectForm(forms.ModelForm):

    x_picture = forms.FloatField(widget=forms.HiddenInput(), required=False, label='')
    y_picture = forms.FloatField(widget=forms.HiddenInput(), required=False, label='')
    width_picture = forms.FloatField(widget=forms.HiddenInput(), required=False, label='')
    height_picture = forms.FloatField(widget=forms.HiddenInput(), required=False, label='')

    class Meta:
        model = Project
        fields = ['title', 'description', 'picture']

    def save(self):
        project = super(ProjectForm, self).save()

        if self.cleaned_data.get('x_picture') != None:
            x = self.cleaned_data.get('x_picture')
            y = self.cleaned_data.get('y_picture')
            w = self.cleaned_data.get('width_picture')
            h = self.cleaned_data.get('height_picture')
            image = Image.open(project.picture)
            cropped_image = image.crop((x, y, w+x, h+y))
            resized_image = cropped_image
            resized_image.save(project.picture.path)

        return project