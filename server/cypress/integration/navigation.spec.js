// go trough routes and make sure things render as expected
describe('validate routes', () => {
  it('viewer routes', () => {
    cy.visit('http://localhost:4001/');
    cy.contains('Time Now');

    cy.visit('http://localhost:4001/timer');
    cy.contains('Time Now');

    cy.visit('http://localhost:4001/presenter');
    cy.contains('Time Now');

    cy.visit('http://localhost:4001/speaker');
    cy.contains('Time Now');

    cy.visit('http://localhost:4001/stage');
    cy.contains('Time Now');

    cy.visit('http://localhost:4001/backstage');
    cy.contains('Today');
    cy.contains('Time Now');
    cy.contains('Info');

    cy.visit('http://localhost:4001/sm');
    cy.contains('Today');
    cy.contains('Time Now');
    cy.contains('Info');

    cy.visit('http://localhost:4001/public');
    cy.contains('Today');
    cy.contains('Time Now');
    cy.contains('Info');

    cy.visit('http://localhost:4001/pip');
    cy.contains('Today');
    cy.contains('Info');

    cy.visit('http://localhost:4001/studio');
    cy.contains('ON AIR');
  });

  it('editor routes', () => {
    cy.visit('http://localhost:4001/editor');
    cy.contains('Event List');
    cy.contains('Timer Control');
    cy.contains('Messages Control');
    cy.contains('Info');
  });

  it('self contained editor routes', () => {
    cy.visit('http://localhost:4001/eventlist');
    cy.contains('Event List');
    cy.visit('http://localhost:4001/timercontrol');
    cy.contains('Timer Control');
    cy.visit('http://localhost:4001/messagecontrol');
    cy.contains('Messages Control');
    cy.visit('http://localhost:4001/info');
    cy.contains('Info');
  });

  it('table routes', () => {
    cy.visit('http://localhost:4001/table');
    cy.contains('Running Timer');

    cy.visit('http://localhost:4001/cuesheet');
    cy.contains('Running Timer');

    cy.visit('http://localhost:4001/cuelist');
    cy.contains('Running Timer');
  });
});
