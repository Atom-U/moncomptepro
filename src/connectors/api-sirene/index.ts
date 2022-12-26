import axios, { AxiosError } from 'axios';
import {
  formatAdresseEtablissement,
  formatEnseigne,
  formatNomComplet,
  libelleFromCategoriesJuridiques,
  libelleFromCodeEffectif,
  libelleFromCodeNaf,
} from './formatters';

const { INSEE_CONSUMER_KEY, INSEE_CONSUMER_SECRET } = process.env;

export const getOrganizationInfo = async (
  siret: string
): Promise<OrganizationInfo | {}> => {
  try {
    const {
      data: { access_token },
    } = await axios.post(
      'https://api.insee.fr/token',
      'grant_type=client_credentials',
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: {
          username: INSEE_CONSUMER_KEY!,
          password: INSEE_CONSUMER_SECRET!,
        },
      }
    );

    const {
      data: { etablissement },
    } = await axios.get(
      `https://api.insee.fr/entreprises/sirene/V3/siret/${siret}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const {
      siret: siretFromInseeApi,
      trancheEffectifsEtablissement,
      anneeEffectifsEtablissement,
      adresseEtablissement,
      statutDiffusionEtablissement,
      periodesEtablissement,
      uniteLegale,
    } = etablissement;

    if (statutDiffusionEtablissement === 'N') {
      return {};
    }

    const {
      categorieJuridiqueUniteLegale,
      denominationUniteLegale,
      sigleUniteLegale,
      nomUniteLegale,
      nomUsageUniteLegale,
      prenomUsuelUniteLegale,
      trancheEffectifsUniteLegale,
    } = uniteLegale;

    // get last period to obtain most recent data
    const {
      activitePrincipaleEtablissement,
      enseigne1Etablissement,
      enseigne2Etablissement,
      enseigne3Etablissement,
      etatAdministratifEtablissement,
    } = periodesEtablissement[0];

    const { codePostalEtablissement } = adresseEtablissement;

    const enseigne = formatEnseigne(
      enseigne1Etablissement,
      enseigne2Etablissement,
      enseigne3Etablissement
    );

    const nomComplet = formatNomComplet({
      denominationUniteLegale,
      prenomUsuelUniteLegale,
      nomUniteLegale,
      nomUsageUniteLegale,
      sigleUniteLegale,
    });

    const organizationLabel = `${nomComplet}${
      enseigne ? ` - ${enseigne}` : ''
    }`;

    return {
      siret: siretFromInseeApi,
      libelle: organizationLabel,
      nomComplet,
      enseigne,
      trancheEffectifs: trancheEffectifsEtablissement,
      trancheEffectifsUniteLegale,
      libelleTrancheEffectif: libelleFromCodeEffectif(
        trancheEffectifsEtablissement,
        anneeEffectifsEtablissement
      ),
      etatAdministratif: etatAdministratifEtablissement,
      estActive: etatAdministratifEtablissement === 'A',
      statutDiffusion: statutDiffusionEtablissement,
      estDiffusible: statutDiffusionEtablissement !== 'N',
      adresse: formatAdresseEtablissement(adresseEtablissement),
      codePostal: codePostalEtablissement,
      activitePrincipale: activitePrincipaleEtablissement,
      libelleActivitePrincipale: libelleFromCodeNaf(
        activitePrincipaleEtablissement
      ),
      categorieJuridique: categorieJuridiqueUniteLegale,
      libelleCategorieJuridique: libelleFromCategoriesJuridiques(
        categorieJuridiqueUniteLegale
      ),
    };
  } catch (e) {
    if (
      e instanceof AxiosError &&
      e.response &&
      [403, 404].includes(e.response.status)
    ) {
      return {};
    }
    throw e;
  }
};
