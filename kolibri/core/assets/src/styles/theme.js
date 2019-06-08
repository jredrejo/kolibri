import Vue from 'vue';
import logger from 'kolibri.lib.logging';

import materialColors from './materialColors.js';

const logging = logger.getLogger(__filename);

const staticState = {
  modality: null,
  colors: {
    palette: materialColors,
    brand: global.kolibriTheme.brandColors,
  },
  tokenMapping: Object.assign(
    {
      // brand shortcuts
      primary: 'brand.primary.v_400',
      primaryLight: 'brand.primary.v_100',
      primaryDark: 'brand.primary.v_700',
      secondary: 'brand.secondary.v_400',
      secondaryLight: 'brand.secondary.v_100',
      secondaryDark: 'brand.secondary.v_700',
      logoText: 'brand.primary.v_300',

      // UI colors
      text: 'palette.grey.v_900',
      textDisabled: 'palette.grey.v_300',
      annotation: 'palette.grey.v_700',
      textInverted: 'white',
      loading: 'brand.secondary.v_200',
      focusOutline: 'brand.secondary.v_200',
      surface: 'white',
      fineLine: '#dedede',

      // general semantic colors
      error: 'palette.red.v_700',
      success: 'palette.green.v_700',

      // Kolibri-specific semantic colors
      progress: 'palette.lightblue.v_500',
      mastered: 'palette.amber.v_500',
      correct: 'palette.green.v_600',
      incorrect: 'palette.red.v_800',
      coachContent: 'palette.lightblue.v_800',
      superAdmin: 'palette.amber.v_600',

      // content colors
      exercise: 'palette.cyan.v_600',
      video: 'palette.indigo.v_700',
      audio: 'palette.pink.v_400',
      document: 'palette.deeporange.v_600',
      html5: 'palette.yellow.v_800',
      topic: 'palette.grey.v_800',
    },
    global.kolibriTheme.tokenMapping
  ),
};

function throwThemeError(tokenName, mapString) {
  throw `Theme issue: '${tokenName}' has invalid mapping '${mapString}'`;
}

const hexcolor = RegExp('#[0-9a-fA-F]{6}');

function getTokens() {
  const tokens = {};
  // look at each token map
  Object.keys(staticState.tokenMapping).forEach(function(tokenName) {
    const mapString = staticState.tokenMapping[tokenName];
    // if it doesn't look like a path, interpret value as a CSS color value
    if (mapString.indexOf('.') === -1) {
      tokens[tokenName] = mapString;
      return;
    }
    // otherwise try to use the dot notation to navigate down the color tree
    const refs = mapString.split('.');
    let obj = staticState.colors;
    while (refs.length) {
      const key = refs.shift();
      if (!obj[key]) {
        throwThemeError(tokenName, mapString);
      }
      obj = obj[key];
    }
    if (typeof obj !== 'string') {
      throwThemeError(tokenName, mapString);
    }
    if (!hexcolor.test(obj)) {
      logging.warn(`Theme issue: Unexpected value '${obj}' for token '${tokenName}'`);
    }
    // if we end up at a valid string, use it
    tokens[tokenName] = obj;
  });
  return tokens;
}

const tokens = getTokens();

export const dynamicState = Vue.observable({ modality: null });

export default {
  $themeTokens() {
    return tokens;
  },
  $themeColors() {
    return staticState.colors;
  },
  $theme() {
    return global.kolibriTheme;
  },
  // Should only use these styles to outline stuff that will be focused
  // on keyboard-tab-focus
  $coreOutline() {
    if (dynamicState.modality !== 'keyboard') {
      return {
        outline: 'none',
      };
    }
    return {
      outlineColor: getTokens().focusOutline,
      outlineStyle: 'solid',
      outlineWidth: '3px',
      outlineOffset: '4px',
    };
  },
  // Should use this when the outline needs to be applied regardless
  // of modality
  $coreOutlineAnyModality() {
    return {
      outlineColor: getTokens().focusOutline,
      outlineStyle: 'solid',
      outlineWidth: '3px',
      outlineOffset: '4px',
    };
  },
};
