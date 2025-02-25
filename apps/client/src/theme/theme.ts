import { createSystem, defaultConfig } from '@chakra-ui/react';

import { ontimeAlertRecipe } from './ontimeAlert';
import { ontimeButtonRecipe } from './ontimeButton';
import { ontimeCheckboxRecipe } from './ontimeCheckbox';
import { ontimeDrawerRecipe } from './ontimeDrawer';
import { ontimeMenuRecipe } from './ontimeMenu';
import { ontimeDialogRecipe } from './ontimeModal';
import { ontimeRadioGroupRecipe } from './ontimeRadio';
import { ontimeNativeSelectRecipe, ontimeSelectRecipe } from './ontimeSelect';
import { ontimeSwitchRecipe } from './ontimeSwitch';
import { ontimeInputRecipe, ontimeTextareaRecipe } from './ontimeTextInputs';
import { ontimeTooltipRecipe } from './ontimeTooltip';

const system = createSystem(defaultConfig, {
  theme: {
    slotRecipes: {
      alert: ontimeAlertRecipe,
      checkbox: ontimeCheckboxRecipe,
      dialog: ontimeDialogRecipe,
      drawer: ontimeDrawerRecipe,
      menu: ontimeMenuRecipe,
      radioGroup: ontimeRadioGroupRecipe,
      select: ontimeSelectRecipe,
      nativeSelect: ontimeNativeSelectRecipe,
      switch: ontimeSwitchRecipe,
      tooltip: ontimeTooltipRecipe,
    },
    recipes: {
      button: ontimeButtonRecipe,
      input: ontimeInputRecipe,
      textarea: ontimeTextareaRecipe,
    },
  },
});

export default system;
