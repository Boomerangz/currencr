# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-05-31 18:55
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finsite', '0007_auto_20170531_1843'),
    ]

    operations = [
        migrations.AddField(
            model_name='newsitem',
            name='keywords',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=200), blank=True, default=None, size=None),
            preserve_default=False,
        ),
    ]