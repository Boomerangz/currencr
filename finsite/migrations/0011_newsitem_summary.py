# -*- coding: utf-8 -*-
# Generated by Django 1.11.3 on 2017-07-14 08:36
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finsite', '0010_currency_ordering'),
    ]

    operations = [
        migrations.AddField(
            model_name='newsitem',
            name='summary',
            field=models.TextField(blank=True, default=None, null=True),
        ),
    ]