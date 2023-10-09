const MONCOMPTEPRO_HOST =
  Cypress.env('MONCOMPTEPRO_HOST') || 'http://localhost:3000';

describe('join organizations', () => {
  before(() => {
    cy.mailslurp().then((mailslurp) =>
      mailslurp.inboxController.deleteAllInboxEmails({
        inboxId: '01714bdb-c5d7-48c9-93ab-73dc78c13609',
      })
    );
    cy.mailslurp().then((mailslurp) =>
      mailslurp.inboxController.deleteAllInboxEmails({
        inboxId: '10efdabd-deb0-4d19-a521-6772ca27acf8',
      })
    );
  });

  it('join collectivité territoriale with code send to official contact email', function () {
    cy.login(
      '10efdabd-deb0-4d19-a521-6772ca27acf8@mailslurp.com',
      'password123'
    );

    cy.visit(`${MONCOMPTEPRO_HOST}/users/join-organization`);
    cy.get('[name="siret"]').type('19750663700010');
    cy.get('[type="submit"]').click();

    // Check that the website is waiting for the user to verify their email
    cy.get('#email-badge-lowercase').contains(
      '01714bdb-c5d7-48c9-93ab-73dc78c13609@mailslurp.com'
    );

    // Verify the email with the code received by email
    cy.mailslurp()
      // use inbox id and a timeout of 30 seconds
      .then((mailslurp) =>
        mailslurp.waitForLatestEmail(
          '01714bdb-c5d7-48c9-93ab-73dc78c13609',
          60000,
          true
        )
      )
      // extract the verification code from the email subject
      .then((email) => {
        const matches =
          /.*<a style="text-decoration:none; color:#000091; font-weight:normal;" target="_blank"><strong>([a-z]{2,25}-[a-z]{2,25})<\/strong><\/a>.*/.exec(
            email.body
          );
        if (matches && matches.length > 0) {
          return matches[1];
        }
        throw new Error('Could not find verification code in received email');
      })
      // fill out the verification form and submit
      .then((code) => {
        cy.get('[name="official_contact_email_verification_token"]').type(code);
        cy.get('[type="submit"]').click();
      });

    cy.contains('Votre compte est créé');

    cy.mailslurp()
      .then((mailslurp) =>
        mailslurp.waitForLatestEmail(
          '01714bdb-c5d7-48c9-93ab-73dc78c13609',
          60000,
          true
        )
      )
      // assert reception of notification email
      .then((email) => {
        expect(email.body).to.match(
          /.*Jean Nouveau.*\(10efdabd-deb0-4d19-a521-6772ca27acf8@mailslurp\.com\) a rejoint votre organisation.*Lycee general et technologique chaptal.*sur .*MonComptePro/
        );
      });
  });
});
