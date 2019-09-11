from __future__ import absolute_import
from __future__ import print_function
from __future__ import unicode_literals

from kolibri.core.webpack import hooks as webpack_hooks
from kolibri.plugins import KolibriPluginBase
from kolibri.plugins.user import hooks


class OpenIDConnect(KolibriPluginBase):
    root_view_urls = "root_urls"
    django_settings = "settings"
    kolibri_options = "options"

    # @property
    # def url_slug(self):
    #     return "^oidc_provider/"


class LoginItem(webpack_hooks.WebpackBundleHook):
    # inline = True
    unique_slug = "openid_login_item"
    src_file = "assets/src/views/OIDCLogin.vue"


class LoginItemInclusionHook(hooks.UserSyncHook):
    bundle_class = LoginItem
