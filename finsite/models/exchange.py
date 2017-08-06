from django.db import models

class Exchange(models.Model):
    name = models.CharField(max_length=100)
    pseudonym = models.CharField(max_length=100)    
    link = models.CharField(max_length=1024)    

    def __str__(self):
        return self.pseudonym
