import Lockr from 'lockr';

export default function useSyncStateRouter(vm, service, initialEvent) {
    const synchronizeRouteAndMachine = (state) => {
        if (!state) return;

        const { meta } = state;


        // Dump out of here if there is nothing to resume from
        if (!Object.keys(meta).length) {
          vm.$router.replace('/');
          return;
        }

        const newRoute = meta[Object.keys(meta)[0]].route;
        if (newRoute) {
          // Avoid redundant navigation
          if (vm.$route.name !== newRoute.name) {
            vm.$router.replace(newRoute);
          }
        } else {
          vm.$router.replace('/');
        }
      };

      const initializeState = () => {
        // each xstate actor will save its state in its own key in the browser local storage
        const localStorageKey = `savedState_${service.id}`

        // Note the second arg to Lockr.get is a fallback if the first arg is not found
        const savedState = Lockr.get(localStorageKey, 'initializeContext');

        // Either the string 'initializeContext' or a valid state object returned from Lockr
        if (savedState !== 'initializeContext') {
          // Update the route if there is a saved state
          synchronizeRouteAndMachine(savedState);
        } else {
          // Or set the app context state on the machine and proceed to the first state
          service.send(initialEvent);
        }

        service.start(savedState);

        service.onTransition((state) => {
          // When the Actor changes from states in the machine, sync the route:
          synchronizeRouteAndMachine(state);
          Lockr.set(localStorageKey, service._state);
        });
      };

      const cleanupState = () => {
        Lockr.set(localStorageKey, null);
        service.stop();
      };

      return {
        initializeState,
        cleanupState,
      };
}
