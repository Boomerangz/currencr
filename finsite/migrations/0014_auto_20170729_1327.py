# -*- coding: utf-8 -*-
# Generated by Django 1.11.3 on 2017-07-29 13:27
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finsite', '0013_auto_20170721_0707'),
    ]

    operations = [
        migrations.AddField(
            model_name='currencyhistoryrecord',
            name='exchange',
            field=models.CharField(default='Kraken', max_length=10),
        ),
        migrations.AlterField(
            model_name='currencyhistoryrecord',
            name='time',
            field=models.DateTimeField(),
        ),
    ]
