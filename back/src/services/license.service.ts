export function publicationLicense(license = 'unspecified', attribution = '') {
  if (!['unspecified', 'reserved', 'CC-BY-4.0', 'CC-BY-SA-4.0'].includes(license)) {
    throw Object.assign(Error('Choose a supported license.'), { statusCode: 400 });
  }
  const credit = attribution.trim();
  const needsCredit = license === 'CC-BY-4.0' || license === 'CC-BY-SA-4.0';
  if (attribution.length > 200 || (needsCredit && !credit)) {
    throw Object.assign(Error('Add an author credit of up to 200 characters.'), { statusCode: 400 });
  }
  return { license, attribution: needsCredit ? credit : '' };
}
