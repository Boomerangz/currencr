from django import template

register = template.Library()

@register.simple_tag
def cr_divide_and_format(base, quote, t_len):
    return cr_format(base / quote, t_len)

@register.simple_tag
def cr_format(value, t_len):
    left = "%.0f" % (value)
    r_len = t_len - len(left) - 1
    if r_len <= 0:
        return left
    return ("%f" % round(value, r_len)).rstrip('0').rstrip('.')