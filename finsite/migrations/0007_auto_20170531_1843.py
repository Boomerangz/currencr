# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-05-31 18:43
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finsite', '0006_newsitem'),
    ]

    operations = [
        migrations.AlterField(
            model_name='newsitem',
            name='image',
            field=models.CharField(blank=True, default=None, max_length=500, null=True),
        ),
    ]
