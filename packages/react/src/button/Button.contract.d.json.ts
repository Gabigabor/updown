// Generated from Button.contract.json by packages/contracts/scripts/build.mjs. Do not edit.
// Gives the JSON import its exact literal types (TypeScript allowArbitraryExtensions).
declare const contract: {
  readonly "name": "Button";
  readonly "status": "beta";
  readonly "description": "Starts an action. Hovered, Pressed and Focused come from React Aria, so they are states, not props.";
  readonly "category": "inputs";
  readonly "anatomy": readonly ["container", "leading-icon", "label", "trailing-icon", "state-overlay", "focus-ring"];
  readonly "props": {
    readonly "appearance": {
      readonly "values": readonly ["filled", "outlined", "text"];
      readonly "default": "filled";
      readonly "figma": "Appearance";
      readonly "description": "Emphasis: Filled (highest), Outlined (medium), Text (lowest).";
    };
    readonly "variant": {
      readonly "values": readonly ["primary", "neutral", "destructive", "inverse"];
      readonly "default": "primary";
      readonly "figma": "Variant";
      readonly "description": "Primary for the main action, Neutral for secondary actions, Destructive for actions that delete or can’t be undone, Inverse only on dark backgrounds (surface/inverse).";
    };
    readonly "size": {
      readonly "values": readonly ["small", "medium", "large"];
      readonly "default": "medium";
      readonly "figma": "Size";
      readonly "description": "Height: Small 1.5rem (24px), Medium 2rem (32px), Large 2.75rem (44px).";
    };
  };
  readonly "states": readonly ["default", "hovered", "pressed", "focused", "disabled"];
  readonly "stateTokenNames": {
    readonly "hovered": "hover";
    readonly "pressed": "pressed";
    readonly "focused": "focus";
  };
  readonly "tokens": readonly [{
    readonly "part": "container";
    readonly "property": "height";
    readonly "token": "size/{size}/height";
  }, {
    readonly "part": "container";
    readonly "property": "padding-x";
    readonly "token": "size/{size}/padding-x";
  }, {
    readonly "part": "container";
    readonly "property": "gap";
    readonly "token": "size/{size}/gap";
  }, {
    readonly "part": "container";
    readonly "property": "corner-radius";
    readonly "token": "size/border-radius";
  }, {
    readonly "part": "container";
    readonly "property": "border-width";
    readonly "token": "size/border-width";
    readonly "when": {
      readonly "appearance": readonly ["outlined"];
    };
  }, {
    readonly "part": "leading-icon";
    readonly "property": "size";
    readonly "token": "size/{size}/icon-size";
  }, {
    readonly "part": "trailing-icon";
    readonly "property": "size";
    readonly "token": "size/{size}/icon-size";
  }, {
    readonly "part": "label";
    readonly "property": "textStyle";
    readonly "token": "Label/Small";
    readonly "when": {
      readonly "size": readonly ["small"];
    };
  }, {
    readonly "part": "label";
    readonly "property": "textStyle";
    readonly "token": "Label/Medium";
    readonly "when": {
      readonly "size": readonly ["medium"];
    };
  }, {
    readonly "part": "label";
    readonly "property": "textStyle";
    readonly "token": "Label/Large";
    readonly "when": {
      readonly "size": readonly ["large"];
    };
  }, {
    readonly "part": "container";
    readonly "property": "background";
    readonly "token": "color/{variant}/filled/background";
    readonly "when": {
      readonly "appearance": readonly ["filled"];
      readonly "state": readonly ["default", "hovered", "pressed", "focused"];
    };
  }, {
    readonly "part": "container";
    readonly "property": "border";
    readonly "token": "color/{variant}/outlined/border";
    readonly "when": {
      readonly "appearance": readonly ["outlined"];
      readonly "state": readonly ["default", "hovered", "pressed", "focused"];
    };
  }, {
    readonly "part": "label";
    readonly "property": "color";
    readonly "token": "color/{variant}/{appearance}/label";
    readonly "when": {
      readonly "state": readonly ["default", "hovered", "pressed", "focused"];
    };
  }, {
    readonly "part": "leading-icon";
    readonly "property": "color";
    readonly "token": "color/{variant}/{appearance}/label";
    readonly "when": {
      readonly "state": readonly ["default", "hovered", "pressed", "focused"];
    };
  }, {
    readonly "part": "trailing-icon";
    readonly "property": "color";
    readonly "token": "color/{variant}/{appearance}/label";
    readonly "when": {
      readonly "state": readonly ["default", "hovered", "pressed", "focused"];
    };
  }, {
    readonly "part": "state-overlay";
    readonly "property": "fill";
    readonly "token": "color/state/{state}";
    readonly "when": {
      readonly "state": readonly ["hovered", "pressed", "focused"];
      readonly "variant": readonly ["primary", "destructive"];
    };
  }, {
    readonly "part": "state-overlay";
    readonly "property": "fill";
    readonly "token": "color/state/{state}";
    readonly "when": {
      readonly "state": readonly ["hovered", "pressed", "focused"];
      readonly "variant": readonly ["neutral"];
      readonly "appearance": readonly ["outlined", "text"];
    };
  }, {
    readonly "part": "state-overlay";
    readonly "property": "fill";
    readonly "token": "color/state/{state}";
    readonly "when": {
      readonly "state": readonly ["hovered", "pressed", "focused"];
      readonly "variant": readonly ["inverse"];
      readonly "appearance": readonly ["filled"];
    };
  }, {
    readonly "part": "state-overlay";
    readonly "property": "fill";
    readonly "token": "color/state/inverse/{state}";
    readonly "when": {
      readonly "state": readonly ["hovered", "pressed", "focused"];
      readonly "variant": readonly ["neutral"];
      readonly "appearance": readonly ["filled"];
    };
  }, {
    readonly "part": "state-overlay";
    readonly "property": "fill";
    readonly "token": "color/state/inverse/{state}";
    readonly "when": {
      readonly "state": readonly ["hovered", "pressed", "focused"];
      readonly "variant": readonly ["inverse"];
      readonly "appearance": readonly ["outlined", "text"];
    };
  }, {
    readonly "part": "focus-ring";
    readonly "property": "stroke";
    readonly "token": "colors/focus-ring";
    readonly "when": {
      readonly "state": readonly ["focused"];
    };
  }, {
    readonly "part": "focus-ring";
    readonly "property": "stroke-width";
    readonly "token": "sizes/focus-ring/width";
    readonly "when": {
      readonly "state": readonly ["focused"];
    };
  }, {
    readonly "part": "focus-ring";
    readonly "property": "offset";
    readonly "token": "sizes/focus-ring/offset";
    readonly "when": {
      readonly "state": readonly ["focused"];
    };
  }, {
    readonly "part": "container";
    readonly "property": "background";
    readonly "token": "color/disabled/background";
    readonly "when": {
      readonly "state": readonly ["disabled"];
      readonly "appearance": readonly ["filled"];
      readonly "variant": readonly ["primary", "neutral", "destructive"];
    };
  }, {
    readonly "part": "container";
    readonly "property": "border";
    readonly "token": "color/disabled/border";
    readonly "when": {
      readonly "state": readonly ["disabled"];
      readonly "appearance": readonly ["outlined"];
      readonly "variant": readonly ["primary", "neutral", "destructive"];
    };
  }, {
    readonly "part": "label";
    readonly "property": "color";
    readonly "token": "color/disabled/label";
    readonly "when": {
      readonly "state": readonly ["disabled"];
      readonly "variant": readonly ["primary", "neutral", "destructive"];
    };
  }, {
    readonly "part": "container";
    readonly "property": "background";
    readonly "token": "color/inverse/disabled/background";
    readonly "when": {
      readonly "state": readonly ["disabled"];
      readonly "appearance": readonly ["filled"];
      readonly "variant": readonly ["inverse"];
    };
  }, {
    readonly "part": "container";
    readonly "property": "border";
    readonly "token": "color/inverse/disabled/border";
    readonly "when": {
      readonly "state": readonly ["disabled"];
      readonly "appearance": readonly ["outlined"];
      readonly "variant": readonly ["inverse"];
    };
  }, {
    readonly "part": "label";
    readonly "property": "color";
    readonly "token": "color/inverse/disabled/label";
    readonly "when": {
      readonly "state": readonly ["disabled"];
      readonly "variant": readonly ["inverse"];
    };
  }];
  readonly "a11y": {
    readonly "role": "button";
    readonly "requires": readonly ["An accessible name: visible label, or aria-label when the button shows only an icon"];
    readonly "keyboard": readonly ["Enter", "Space"];
  };
  readonly "rules": {
    readonly "do": readonly [{
      readonly "text": "Use filled primary for the single main action in a view; pair it with outlined or text buttons.";
      readonly "example": readonly [{
        readonly "appearance": "filled";
        readonly "variant": "primary";
        readonly "children": "Save";
      }, {
        readonly "appearance": "outlined";
        readonly "variant": "neutral";
        readonly "children": "Cancel";
      }];
    }, {
      readonly "text": "Use destructive only for actions that delete or can’t be undone.";
      readonly "example": readonly [{
        readonly "appearance": "text";
        readonly "variant": "neutral";
        readonly "children": "Keep";
      }, {
        readonly "appearance": "filled";
        readonly "variant": "destructive";
        readonly "children": "Delete project";
      }];
    }, {
      readonly "text": "Put inverse buttons only on surface/inverse backgrounds.";
      readonly "example": readonly [{
        readonly "appearance": "filled";
        readonly "variant": "inverse";
        readonly "children": "Got it";
      }, {
        readonly "appearance": "text";
        readonly "variant": "inverse";
        readonly "children": "Later";
      }];
    }, {
      readonly "text": "Disable with isDisabled: the disabled tokens give the 25 % look.";
      readonly "example": readonly [{
        readonly "appearance": "filled";
        readonly "variant": "primary";
        readonly "isDisabled": true;
        readonly "children": "Save";
      }, {
        readonly "appearance": "outlined";
        readonly "variant": "primary";
        readonly "isDisabled": true;
        readonly "children": "Cancel";
      }];
    }];
    readonly "dont": readonly [{
      readonly "text": "Don’t put two filled primary buttons side by side: nothing tells the user which is the main action.";
      readonly "example": readonly [{
        readonly "appearance": "filled";
        readonly "variant": "primary";
        readonly "children": "Save";
      }, {
        readonly "appearance": "filled";
        readonly "variant": "primary";
        readonly "children": "Cancel";
      }];
    }, {
      readonly "text": "Don’t use destructive for actions that can be undone.";
      readonly "example": readonly [{
        readonly "appearance": "filled";
        readonly "variant": "destructive";
        readonly "children": "Archive";
      }];
    }, {
      readonly "text": "Don’t use inverse on normal surfaces; use primary or neutral.";
      readonly "background": "surface";
      readonly "example": readonly [{
        readonly "appearance": "filled";
        readonly "variant": "inverse";
        readonly "children": "Got it";
      }];
    }, {
      readonly "text": "Don’t dim a disabled button with opacity; the disabled tokens already do it.";
    }];
  };
  readonly "figma": {
    readonly "componentSet": "Button";
    readonly "stateProperty": "State";
    readonly "lockLightMode": {
      readonly "variant": readonly ["inverse"];
    };
  };
  readonly "storybook": {
    readonly "title": "Inputs/Button";
  };
};
export default contract;
