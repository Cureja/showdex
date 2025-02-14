import { type DropdownOption } from '@showdex/components/form';
import { FormatLabels } from '@showdex/consts/dex';
import { type CalcdexPokemonPreset } from '@showdex/redux/store';
import { getGenlessFormat } from '@showdex/utils/dex';
import { percentage } from '@showdex/utils/humanize';

export type CalcdexPokemonPresetOption = DropdownOption<string>;

const SubLabelRegex = /([^()]+)\x20+(?:\+\x20+(\w[\w\x20]*)|\((\w.*)\))$/i;

/**
 * Builds the value for the `options` prop of the presets `Dropdown` component in `PokeInfo`.
 *
 * @since 1.0.3
 */
export const buildPresetOptions = (
  presets: CalcdexPokemonPreset[],
  usages?: CalcdexPokemonPreset[],
): CalcdexPokemonPresetOption[] => {
  const options: CalcdexPokemonPresetOption[] = [];

  if (!presets?.length) {
    return options;
  }

  presets.forEach((preset) => {
    if (!preset?.calcdexId || !preset.name || !preset.format) {
      return;
    }

    const option: CalcdexPokemonPresetOption = {
      label: preset.name,
      value: preset.calcdexId,
    };

    // e.g., 'Iron Defense (Flying)' -> { label: 'Iron Defense', rightLabel: 'FLYING' },
    // 'Defensive (Physical Attacker)' -> { label: 'Defensive', subLabel: 'PHYSICAL ATTACKER' },
    // 'Metal Sound + Steelium Z' -> { label: 'Metal Sound', subLabel: '+ STEELIUM Z' },
    // 'The Pex' -> (regex fails) -> { label: 'The Pex' } (untouched lol)
    if (SubLabelRegex.test(String(option.label))) {
      // update (2022/10/18): added default `[]` here cause the regex is letting some invalid
      // option.label through and I'm too lazy to find out what that is rn lol
      const [
        ,
        label,
        plusLabel,
        subLabel,
      ] = SubLabelRegex.exec(String(option.label)) || [];

      // it'll be one or the other since the capture groups are alternatives in a non-capturing group
      const actualSubLabel = (!!plusLabel && `+ ${plusLabel}`) || subLabel;

      if (label && actualSubLabel) {
        option.label = label;
        option.subLabel = actualSubLabel;
      }
    }

    // attempt to find this preset's usage percentage (typically only in Gen 9 Randoms)
    const usage = preset.usage
      || usages?.find((p) => p?.source === 'usage' && p.name.includes(preset.name))?.usage
      || 0;

    if (usage > 0) {
      option.rightLabel = percentage(usage, 2);
    }

    const genlessFormat = getGenlessFormat(preset.format);
    const groupLabel = (!!genlessFormat && FormatLabels?.[genlessFormat]) || genlessFormat;
    const group = options.find((o) => o.label === groupLabel);

    if (!group) {
      options.push({
        label: groupLabel,
        options: [option],
      });

      return;
    }

    group.options.push(option);
  });

  return options;
};
