import {
  primary as qualifiersPrimary,
  text as qualifiersText,
  position as qualifiersPosition
} from '../constants/qualifiers';

export const props = ['overlays'];

export function plugin({ cldImage, options } = {}) {
  const { overlays = [] } = options;

  const type = 'overlay';
  const typeQualifier = 'l';

  overlays.forEach(({ publicId, position, text, effects: layerEffects = [], ...options }) => {
    const hasPublicId = typeof publicId === 'string';
    const hasText = typeof text === 'object';
    const hasPosition = typeof position === 'object';

    if ( !hasPublicId && !hasText ) {
      console.warn(`An ${type} is missing Public ID or Text`);
      return;
    }

    // Start to construct the transformation string using text or the public ID
    // if it's image-based

    let layerTransformation;

    if ( hasText ) {
      layerTransformation = `${typeQualifier}_text`;
    } else {
      layerTransformation = `${typeQualifier}_${publicId.replace(/\//g, ':')}`;
    }

    // Begin organizing transformations based on what it is and the location
    // it needs to be placed in the URL

    const primary = [];
    const applied = [];

    // Gemeral options

    Object.keys(options).forEach(key => {
      if ( !qualifiersPrimary[key] ) return;
      const { qualifier } = qualifiersPrimary[key];
      primary.push(`${qualifier}_${options[key]}`);
    });

    // Layer effects

    layerEffects.forEach(effect => {
      Object.keys(effect).forEach(key => {
        if ( !qualifiersPrimary[key] ) return;
        const { qualifier } = qualifiersPrimary[key];
        primary.push(`${qualifier}_${effect[key]}`);
      });
    });

    // Text styling

    if ( hasText ) {
      const textTransformations = [];

      Object.keys(text).forEach(key => {
        if ( !qualifiersText[key] ) return;

        const { qualifier, location } = qualifiersText[key];

        if ( location === 'primary' ) {
          primary.push(`${qualifier}_${text[key]}`);
        } else {
          textTransformations.push(text[key]);
        }
      });

      layerTransformation = `${layerTransformation}:${textTransformations.join('_')}:${text.text}`
    }

    // Positioning

    if ( hasPosition ) {
      Object.keys(position).forEach(key => {
        if ( !qualifiersPosition[key] ) return;

        const { qualifier } = qualifiersPosition[key];

        applied.push(`${qualifier}_${position[key]}`);
      });
    }

    // Add all primary transformations

    layerTransformation = `${layerTransformation},${primary.join(',')}`;

    // Add all applied transformations

    layerTransformation = `${layerTransformation}/fl_layer_apply`;

    if ( applied.length > 0 ) {
      layerTransformation = `${layerTransformation},${applied.join(',')}`;
    }

    // Finally add it to the image

    cldImage.addTransformation(layerTransformation);
  });
}