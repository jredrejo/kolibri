<template>

  <div class="onboarding">
    <ErrorPage
      v-if="error"
      class="body"
      :class="!windowIsLarge ? 'mobile' : ''"
    />

    <LoadingPage
      v-else-if="loading"
      class="body"
      :class="!windowIsLarge ? 'mobile' : ''"
    />

    <template v-else>
      <router-view />
    </template>
  </div>

</template>


<script>

  import { interpret } from 'xstate';
  import { mapState } from 'vuex';
  import commonCoreStrings from 'kolibri.coreVue.mixins.commonCoreStrings';
  import useKResponsiveWindow from 'kolibri-design-system/lib/composables/useKResponsiveWindow';
  import useSyncStateRouter from 'kolibri.coreVue.composables.useSyncStateRouter';
  import { checkCapability } from 'kolibri.utils.appCapabilities';
  import { wizardMachine } from '../machines/wizardMachine';
  import LoadingPage from './submission-states/LoadingPage';
  import ErrorPage from './submission-states/ErrorPage';

  export default {
    name: 'SetupWizardIndex',
    metaInfo() {
      return {
        title: this.$tr('documentTitle'),
      };
    },
    components: {
      LoadingPage,
      ErrorPage,
    },
    mixins: [commonCoreStrings],
    setup() {
      const { windowIsLarge } = useKResponsiveWindow();
      return { windowIsLarge };
    },
    data() {
      return {
        service: interpret(wizardMachine),
      };
    },
    provide() {
      return {
        wizardService: this.service,
      };
    },
    computed: {
      ...mapState(['loading', 'error']),
    },
    created() {
      // initialize XState machine actor
      const initialEvent = { type: 'CONTINUE', value: checkCapability('get_os_user') }
      const { initializeState, cleanupState } = useSyncStateRouter(this, this.service, initialEvent);
      this.initializeState = initializeState;
      this.cleanupState = cleanupState;
      this.initializeState();
    },
    destroyed() {
      this.cleanupState();
    },
    $trs: {
      documentTitle: {
        message: 'Setup Wizard',
        context:
          "The Kolibri set up wizard helps the admin through the process of creating their facility. The text 'Setup Wizard' is the title of the wizard and this can been seen the in the browser tab when the admin is setting up their facility.",
      },
    },
  };

</script>


<style lang="scss" scoped>

  @import '~kolibri-design-system/lib/styles/definitions';

  // from http://nicolasgallagher.com/micro-clearfix-hack/
  @mixin clearfix() {
    zoom: 1;

    &::after,
    &::before {
      display: table;
      content: '';
    }

    &::after {
      clear: both;
    }
  }

  .onboarding {
    @include clearfix(); // child margin leaks up into otherwise empty parent

    width: 100%;
  }

  .body {
    width: 90%;
    max-width: 550px;
    margin-top: 64px;
    margin-right: auto;
    margin-bottom: 32px;
    margin-left: auto;
  }

  .page-wrapper {
    padding: 8px;
  }

  // Override KPageContainer styles
  /deep/ .page-container {
    overflow: visible;

    &.small {
      padding: 16px;
    }
  }

  /deep/ .mobile {
    margin-top: 40px;
    margin-bottom: 24px;
  }

</style>
