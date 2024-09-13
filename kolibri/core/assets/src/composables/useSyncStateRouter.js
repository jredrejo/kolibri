import Lockr from 'lockr';

/*
* The interpreted XState machine is an object that lets you move between states.
* It's current state value has no side effects or dependencies - so we can store it
* as data - then when we initialize the machine each time, we can pass it that data
* to resume the machine as we had saved it.
*
* A key part of this is that we synchronize our router with the machine on every
* transition as each state entry has a `meta` property with a route name that maps
* to a route definition which maps to a specific component.
*
* So - when we load the initial state, the user resumes where they left off if they
* are on the same browser (although we could persist it to the backend if needed too).
*
* NOTE: There may be times when we want to reset to the beginning, unsetting the value
* using Lockr and redirecting to '/' should do the trick.
*/

export default function useSyncStateRouter(vm, service, initialEvent) {
    // each XState actor will save its state in its own key in the browser local storage
    const localStorageKey = `savedState_${service.id}`

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
            // error state is available in some machines:
            if (state.value === 'error') {
                service.send('RESET');
                return;
            }
          // When the Actor changes from states in the machine, sync the route:
          synchronizeRouteAndMachine(state);
          Lockr.set(localStorageKey, service._state);
        });
      };

      const cleanupState = () => {
        Lockr.rm('localStorageKey'); // Clear out saved state machine
        service.stop();
      };

      return {
        initializeState,
        cleanupState,
      };
}
