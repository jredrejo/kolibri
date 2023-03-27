import uniq from 'lodash/uniq';
import { checkCapability } from 'kolibri.utils.appCapabilities';
import { DeviceTypePresets, FacilityTypePresets, LodTypePresets, UsePresets } from '../constants';

/**
 * __ Setting up the XState Visualizer __
 * You can visit https://github.com/statelyai/xstate-viz for everything you need
 * to know to access the visualizer either locally or using their online service.
 */

/**
 * __ Getting Started __
 * At a high level, we will copy and paste code into the Visualizer. The call to
 * `createMachine` is all that is needed there.
 *
 * We have some external depdencies which we will need to mock - anything imported
 * at the top of this file is liable to be used within the machine itself.
 *
 * Thus, we will do best to:
 * 1) Avoid introducing external dependencies wherever possible
 * 2) Provide usable default mocks for all depdencies we do add (commented out)
 *    OR
 *    Know that we will need to directly copy and paste them into the visualizer
 *
 * For now, this means copying the imports from `../constants` and writing a
 * function in place of `checkCapability`.
 */

/**
 * __ Using the Visualizer __
 * The `initialContext` variable below can be adjusted to declare up front what the values are.
 *
 * However, to truly emulate the machine, you will need to use the `Events` tab. If you are ever
 * on a node that says `DO/` then that transition expects an event to be sent with a `value`
 * property. You can use the "Send Event" button to open a little dialog where you can enter
 * JSON. One downside here is that you'll have to reference the *value* of the constants as you
 * cannot reference the code in this dialog.
 *
 * You can click on events to send them, but if there is a `DO/` it implies actions with
 * side effects will occur. Those actions will take in the whole JSON object that you send
 * in the `Events` tab. Note that the use of `value` as a property is just a preference and
 * the only required property is the `type` property indicating what kind of event is sent.
 */

/* eslint-disable-next-line */
import { assign, createMachine, send } from 'xstate';

// NOTE: Uncomment the following function if you're using the visualizer
// const checkCapability = capabilityToCheck => ["get_os_user"].includes(capabilityToCheck);

const initialContext = {
  onMyOwnOrGroup: null,
  facilityNewOrImport: null,
  facilityName: '',
  fullOrLOD: null,
  lodImportOrJoin: null,
  deviceName: '',
  formalOrNonformal: null,
  guestAccess: null,
  learnerCanCreateAccount: null,
  requirePassword: null,
  selectedFacility: null,
  importDeviceId: null,
  importDevice: null,
  superuser: null,
  lodAdmin: {},
  remoteUsers: [],
  importedUsers: [],
  firstImportedLodUser: null,
  facilitiesOnDeviceCount: null,
  history: [],
};

const pushHistoryItem = assign({
  history: (context, event) => [...context.history, event.value],
});

const removeLastHistoryItem = assign({
  history: context => {
    if (context.history.length) {
      return context.history.slice(0, -1);
    } else {
      return [];
    }
  },
});
const setCanGetOsUser = assign({
  canGetOsUser: (_, event) => event.value,
});
const setOnMyOwnOrGroup = assign({
  onMyOwnOrGroup: (_, event) => event.value,
});
const setSuperuser = assign({
  superuser: (_, event) => {
    return event.value;
  },
});

const setDeviceName = assign({
  deviceName: (_, event) => event.value,
});
const setFullOrLOD = assign({
  fullOrLOD: (_, event) => event.value,
});
const setFacilityNewOrImport = assign({
  facilityNewOrImport: (_, event) => {
    return event.value.importOrNew;
  },
  importDeviceId: (_, event) => {
    return event.value.importDeviceId;
  },
});
const setFacilityTypeAndName = assign({
  formalOrNonformal: (_, event) => event.value.selected,
  facilityName: (_, event) => event.value.facilityName,
});
const setGuestAccess = assign({
  guestAccess: (_, event) => event.value,
});
const setLearnerCanCreateAccount = assign({
  learnerCanCreateAccount: (_, event) => event.value,
});
const setRequirePassword = assign({
  requirePassword: (_, event) => event.value,
});

const setSelectedImportDeviceFacility = assign({
  selectedFacility: (_, event) => {
    return event.value.selectedFacility;
  },
  importDevice: (_, event) => {
    return event.value.importDevice;
  },
  facilitiesOnDeviceCount: (_, event) => {
    return event.value.facilitiesCount;
  },
});

const setLodType = assign({
  lodImportOrJoin: (_, event) => event.value.importOrJoin,
  importDeviceId: (_, event) => event.value.importDeviceId,
});

const setRemoteUsers = assign({
  remoteUsers: (_, event) => event.value.users,
});

const setLodAdmin = assign({
  // Used when setting the Admin user for multiple import
  lodAdmin: (_, event) => {
    return {
      username: event.value.adminUsername,
      password: event.value.adminPassword,
      id: event.value.id,
    };
  },
});
const setLodSuperAdmin = assign({
  // Sets the super admin to be set as the device super admin -- the first LOD user imported
  superuser: (ctx, event) => {
    if (!ctx.superuser) {
      return {
        username: event.value.username,
        password: event.value.password,
      };
    } else {
      return ctx.superuser;
    }
  },
});

const states = {
  // This state will be the start so the machine won't progress until
  // the setCanGetOsUser is run to set the context.canGetOsUser value
  initializeContext: {
    on: {
      CONTINUE: {
        target: 'howAreYouUsingKolibri',
        actions: [setCanGetOsUser, send({ type: 'PUSH_HISTORY', value: 'initializeContext' })],
      },
    },
  },
  // Initial step where user selects between "On my own" or "Group learning"
  howAreYouUsingKolibri: {
    meta: { route: { name: 'HOW_ARE_YOU_USING_KOLIBRI', path: '/' } },
    on: {
      CONTINUE: {
        target: 'onMyOwnOrGroupSetup',
        actions: [
          setOnMyOwnOrGroup,
          send({ type: 'PUSH_HISTORY', value: 'howAreYouUsingKolibri' }),
        ],
      },
    },
  },
  // A passthrough step depending on the value of context.onMyOwnOrGroup
  onMyOwnOrGroupSetup: {
    always: [
      {
        // `cond` takes a function that returns a Boolean, continuing to the
        // `target` when it returns truthy
        cond: 'isOnMyOwnOrGroup',
        target: 'defaultLanguage',
      },
      {
        cond: 'isGroupSetup',
        target: 'deviceName',
      },
      // There is no fallback path here; if neither `cond` above is truthy, this will break
    ],
  },

  // The On My Own path
  defaultLanguage: {
    meta: { route: { name: 'DEFAULT_LANGUAGE', path: 'default-language' } },
    on: {
      CONTINUE: {
        target: 'createAccountOrFinalizeSetup',
        actions: [send({ type: 'PUSH_HISTORY', value: 'defaultLanguage' })],
      },
    },
  },
  // A passthrough step depending on the value of context.canGetOsUser
  createAccountOrFinalizeSetup: {
    always: [
      {
        cond: 'canGetOsUser',
        target: 'finalizeSetup',
      },
      {
        target: 'createOnMyOwnAccount',
      },
    ],
  },

  createOnMyOwnAccount: {
    meta: { route: { name: 'CREATE_SUPERUSER_AND_FACILITY', path: 'create-account' } },
    on: {
      CONTINUE: {
        target: 'finalizeSetup',
        actions: [setSuperuser, send({ type: 'PUSH_HISTORY', value: 'createOnMyOwnAccount' })],
      },
    },
  },

  // The Group path
  deviceName: {
    meta: { route: { name: 'DEVICE_NAME', path: 'device-name' } },
    on: {
      CONTINUE: {
        target: 'fullOrLearnOnlyDevice',
        actions: [setDeviceName, send({ type: 'PUSH_HISTORY', value: 'deviceName' })],
      },
    },
  },
  fullOrLearnOnlyDevice: {
    id: 'fullOrLearnOnlyDevice',
    meta: { route: { name: 'FULL_OR_LOD', path: 'full-or-lod' } },
    on: {
      CONTINUE: {
        target: 'fullOrLodSetup',
        actions: [setFullOrLOD, send({ type: 'PUSH_HISTORY', value: 'fullOrLearnOnlyDevice' })],
      },
    },
  },

  // A passthrough step depending on the value of context.fullOrLOD
  // that either continues along with full device setup, or into the Lod setup
  fullOrLodSetup: {
    always: [
      {
        cond: 'isLodSetup',
        target: 'importLodUsers',
      },
      {
        cond: 'isFullSetup',
        target: 'fullDeviceNewOrImportFacility',
      },
    ],
  },

  // Full Device Path
  fullDeviceNewOrImportFacility: {
    meta: { route: { name: 'FULL_NEW_OR_IMPORT_FACILITY' } },
    on: {
      CONTINUE: {
        target: 'facilitySetupType',
        actions: [
          setFacilityNewOrImport,
          send({ type: 'PUSH_HISTORY', value: 'fullDeviceNewOrImportFacility' }),
        ],
      },
    },
  },

  // A passthrough step depending on whether the user is creating a new facility or importing
  facilitySetupType: {
    always: [
      {
        cond: 'isNewFacility',
        target: 'setFacilityPermissions',
      },
      {
        cond: 'isImportFacility',
        target: 'importFacility',
      },
    ],
  },

  // Facility Creation Path
  setFacilityPermissions: {
    meta: { route: { name: 'FACILITY_PERMISSIONS' } },
    on: {
      CONTINUE: {
        target: 'guestAccess',
        actions: [
          setFacilityTypeAndName,
          send({ type: 'PUSH_HISTORY', value: 'setFacilityPermissions' }),
        ],
      },
    },
  },
  guestAccess: {
    meta: { route: { name: 'GUEST_ACCESS' } },
    on: {
      CONTINUE: {
        target: 'createLearnerAccount',
        actions: [setGuestAccess, send({ type: 'PUSH_HISTORY', value: 'guestAccess' })],
      },
    },
  },
  createLearnerAccount: {
    meta: { route: { name: 'CREATE_LEARNER_ACCOUNT' } },
    on: {
      CONTINUE: {
        target: 'requirePassword',
        actions: [
          setLearnerCanCreateAccount,
          send({ type: 'PUSH_HISTORY', value: 'createLearnerAccount' }),
        ],
      },
    },
  },
  requirePassword: {
    meta: { route: { name: 'REQUIRE_PASSWORD' } },
    on: {
      CONTINUE: {
        target: 'personalDataConsent',
        actions: [setRequirePassword, send({ type: 'PUSH_HISTORY', value: 'requirePassword' })],
      },
    },
  },
  personalDataConsent: {
    /**
     * nextEvent here is used to provide the Vue component what command it is expected to send
     * in this particular case
     **/
    meta: { route: { name: 'PERSONAL_DATA_CONSENT' }, nextEvent: 'CONTINUE' },
    on: {
      CONTINUE: {
        target: 'createSuperuserAndFacility',
        actions: [send({ type: 'PUSH_HISTORY', value: 'personalDataConsent' })],
      },
    },
  },
  // A passthrough step depending on the value of context.canGetOsUser - the finalizeSetup state
  // will provision the device with the OS user and create the default facility
  createSuperuserAndFacility: {
    always: [
      {
        cond: 'canGetOsUser',
        target: 'finalizeSetup',
      },
      {
        target: 'createSuperuserAndFacilityForm',
      },
    ],
  },

  // If we're not able to get an OS user, the user creates their account
  createSuperuserAndFacilityForm: {
    meta: { route: { name: 'CREATE_SUPERUSER_AND_FACILITY', path: 'create-account' } },
    on: {
      CONTINUE: {
        target: 'finalizeSetup',
        actions: [
          setSuperuser,
          send({ type: 'PUSH_HISTORY', value: 'createSuperuserAndFacilityForm' }),
        ],
      },
    },
  },

  // It's own little baby state machine
  importFacility: {
    initial: 'selectFacilityForm',
    states: {
      selectFacilityForm: {
        meta: { route: { name: 'SELECT_FACILITY_FOR_IMPORT' } },
        on: {
          CONTINUE: {
            target: 'importAuthentication',
            actions: [
              setSelectedImportDeviceFacility,
              send({ type: 'PUSH_HISTORY', value: 'selectFacilityForm' }),
            ],
          },
        },
      },
      importAuthentication: {
        meta: { route: { name: 'IMPORT_AUTHENTICATION' } },
        on: {
          // THE POINT OF NO RETURN
          CONTINUE: { target: 'loadingTaskPage' },
        },
      },
      loadingTaskPage: {
        meta: { route: { name: 'IMPORT_LOADING' } },
        on: {
          CONTINUE: 'selectSuperAdminAccountForm',
        },
      },
      selectSuperAdminAccountForm: {
        meta: { route: { name: 'SELECT_ADMIN' } },
        on: {
          CONTINUE: {
            target: 'personalDataConsentForm',
            nextEvent: 'FINISH',
            actions: [
              setSuperuser,
              send({ type: 'PUSH_HISTORY', value: 'selectSuperAdminAccountForm' }),
            ],
          },
        },
      },
      personalDataConsentForm: {
        meta: { route: { name: 'IMPORT_DATA_CONSENT' }, nextEvent: 'FINISH' },
      },
    },
    // Listener on the importFacility state; typically this would be above `states` but
    // putting it here flows more with the above as this is the state after the final step
    on: {
      FINISH: 'finalizeSetup',
      BACK_SKIP_FACILITY_FORM: {
        target: '#wizard.fullDeviceNewOrImportFacility',
        actions: ['clearSelectedSetupType', 'revertFullDeviceImport'],
      },
    },
  },

  // LOD machine with substates to manage its own steps
  importLodUsers: {
    initial: 'selectLodSetupType',
    states: {
      selectLodSetupType: {
        meta: { route: { name: 'LOD_SETUP_TYPE' } },
        on: {
          CONTINUE: {
            target: 'selectLodFacility',
            actions: [setLodType, send({ type: 'PUSH_HISTORY', value: 'selectLodSetupType' })],
          },
        },
      },

      selectLodFacility: {
        meta: { route: { name: 'LOD_SELECT_FACILITY' } },
        on: {
          CONTINUE: {
            target: 'lodProceedJoinOrNew',
            actions: 'setSelectedImportDeviceFacility',
          },
        },
      },

      lodProceedJoinOrNew: {
        always: [
          {
            cond: ctx => ctx.lodImportOrJoin === LodTypePresets.JOIN,
            target: 'lodJoinFacility',
          },
          {
            target: 'lodImportUserAuth',
          },
        ],
      },

      // IMPORT
      lodImportUserAuth: {
        meta: { route: { name: 'LOD_IMPORT_USER_AUTH' } },
        on: {
          CONTINUE: {
            target: 'lodLoading',
            actions: [setLodSuperAdmin, send({ type: 'PUSH_HISTORY', value: 'lodImportUserAuth' })],
          },
          CONTINUEADMIN: {
            target: 'lodImportAsAdmin',
            actions: [
              setRemoteUsers,
              setLodAdmin,
              send({ type: 'PUSH_HISTORY', value: 'lodImportUserAuth' }),
            ],
          },
        },
      },

      lodLoading: {
        meta: { route: { name: 'LOD_LOADING_TASK_PAGE' } },
        on: {
          SET_SUPERADMIN: { actions: 'setLodSuperAdmin' },
          IMPORT_ANOTHER: 'lodImportUserAuth',
          // Otherwise send FINISH, which is handled at the root of this sub-machine
        },
      },

      lodImportAsAdmin: {
        meta: { route: { name: 'LOD_IMPORT_AS_ADMIN' } },
        on: {
          LOADING: 'lodLoading',
          SET_SUPERADMIN: { actions: 'setLodSuperAdmin' },
        },
      },

      // JOIN
      lodJoinLoading: {
        meta: { route: { name: 'LOD_JOIN_LOADING_TASK_PAGE' } },
        on: {
          SET_SUPERADMIN: { actions: 'setLodSuperAdmin' },
          IMPORT_ANOTHER: 'lodImportUserAuth',
          // Otherwise send FINISH, which is handled at the root of this sub-machine
        },
      },

      lodJoinFacility: {
        meta: { route: { name: 'LOD_CREATE_USER_FORM' } },
        on: {
          CONTINUE: 'lodJoinLoading',
        },
      },
    },
    // Listener on the lod import state; typically this would be above `states` but
    // putting it here flows more with the above as this is the state after the final step
    on: {
      SET_SUPERUSER: { actions: 'setSuperuser' },
      ADD_IMPORTED_USER: { actions: 'addImportedUser' },
      SET_FIRST_LOD: { actions: 'setFirstLodUser' },
      FINISH: 'finalizeSetup',
    },
  },

  // This is a dead-end where the router will send the user where they need to go
  finalizeSetup: {
    meta: { route: { name: 'FINALIZE_SETUP' } },
  },
};

export const wizardMachine = createMachine(
  {
    id: 'wizard',
    initial: 'initializeContext',
    context: initialContext,
    predictableActionArguments: true,
    on: {
      PUSH_HISTORY: {
        actions: [pushHistoryItem],
      },
      BACK: Object.keys(states).map(state => {
        return {
          target: state,
          cond: context =>
            context.history.length && context.history[context.history.length - 1] === state,
          actions: [removeLastHistoryItem],
        };
      }),
      START_OVER: { target: 'howAreYouUsingKolibri', actions: 'resetContext' },
    },
    states,
  },
  {
    actions: {
      // The `assign` function takes an object that maps keys that match those in the machine's
      // `context`to functions that take two parameters `(context, event)` - where the context
      // is the current context and event refers to the event sent to the machine to initiate a
      // transition.

      clearSelectedSetupType: assign({
        facilityNewOrImport: () => null,
      }),
      clearFullOrLOD: assign({
        fullOrLOD: () => {
          return null;
        },
      }),
      revertFullDeviceImport: assign({
        selectedFacility: () => null,
        importDeviceId: () => null,
      }),

      addImportedUser: assign({
        importedUsers: (ctx, event) => {
          const users = ctx.importedUsers;
          users.push(event.value);
          return uniq(users);
        },
      }),
      setFirstLodUser: assign({
        firstImportedLodUser: (_, event) => event.value,
      }),

      /**
       * Assigns the machine to have the initial context again while maintaining the value of
       * canGetOsUser.

       * This effectively resets the machine's state
       */
      resetContext: assign(initialContext),
    },
    guards: {
      // Functions used to return a true/false value. When the functions are called, they are passed
      // the current value of the machine's context as the only parameter
      isOnMyOwnOrGroup: context => {
        return context.onMyOwnOrGroup === UsePresets.ON_MY_OWN;
      },
      isGroupSetup: context => {
        return context.onMyOwnOrGroup === UsePresets.GROUP;
      },
      canGetOsUser: () => checkCapability('get_os_user'),
      isNewFacility: context => {
        return context.facilityNewOrImport === FacilityTypePresets.NEW;
      },
      isImportFacility: context => {
        return context.facilityNewOrImport === FacilityTypePresets.IMPORT;
      },
      isLodSetup: context => {
        return context.fullOrLOD === DeviceTypePresets.LOD;
      },
      isFullSetup: context => {
        return context.fullOrLOD === DeviceTypePresets.FULL;
      },
    },
  }
);
