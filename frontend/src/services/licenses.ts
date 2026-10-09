export const licenses = {
  unspecified: { label: 'Not specified', name: 'License not specified', description: 'No license has been declared.', url: '' },
  reserved: { label: 'All rights reserved', name: 'All rights reserved', description: 'No additional permission to reuse is granted.', url: '' },
  'CC-BY-4.0': { label: 'Reuse allowed with author credit', name: 'CC BY 4.0', description: 'Reuse and adaptations are allowed, including commercially, with author credit.', url: 'https://creativecommons.org/licenses/by/4.0/' },
  'CC-BY-SA-4.0': { label: 'Reuse allowed with author credit and the same license', name: 'CC BY-SA 4.0', description: 'Reuse is allowed, including commercially. Credit the author and share adaptations under the same or a compatible license.', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
} as const;
export type License = keyof typeof licenses;
