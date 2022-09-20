// go through routes and make sure things render as expected
describe('validate routes', () => {
  describe('viewer routes', () => {
    it('default to stage timer', () => {
      cy.visit('http://localhost:4001/');
      cy.contains('Time Now');
    });

    it('renders stage timer', () => {
      cy.visit('http://localhost:4001/timer');
      cy.contains('Time Now');
    });

    it('renders presenter', () => {
      cy.visit('http://localhost:4001/presenter');
      cy.contains('Time Now');
    });

    it('renders speaker', () => {
      cy.visit('http://localhost:4001/speaker');
      cy.contains('Time Now');
    });

    it('renders backstage view /stage', () => {
      cy.visit('http://localhost:4001/stage');
      cy.contains('Time Now');
    });

    it('renders backstage view /backstage', () => {
      cy.visit('http://localhost:4001/backstage');
      cy.contains('Today');
      cy.contains('Time Now');
      cy.contains('Info');
    });

    it('renders backstage view /sm', () => {
      cy.visit('http://localhost:4001/sm');
      cy.contains('Today');
      cy.contains('Time Now');
      cy.contains('Info');
    });

    it('renders public view', () => {
      cy.visit('http://localhost:4001/public');
      cy.contains('Today');
      cy.contains('Time Now');
      cy.contains('Info');
    });

    it('renders pip view', () => {
      cy.visit('http://localhost:4001/pip');
      cy.contains('Today');
      cy.contains('Info');
    });

    it('renders studio clock', () => {
      cy.visit('http://localhost:4001/studio');
      cy.contains('ON AIR');
    });

    it('renders countdown selection', () => {
      cy.visit('http://localhost:4001/countdown');
      cy.contains('Select an event to follow');
    });

    it('renders countdown with event', () => {
      cy.visit('http://localhost:4001/countdown?event=1');
      cy.contains('Time Now');
      cy.contains('Start Time');
      cy.contains('End Time');
    });
  });
  describe('editor routes', () => {
    it('app editor', () => {
      cy.visit('http://localhost:4001/editor');
      cy.contains('Event List');
      cy.contains('Timer Control');
      cy.contains('Messages Control');
      cy.contains('Info');
    });
    it('self contained eventlist', () => {
      cy.visit('http://localhost:4001/eventlist');
      cy.get('.App').should('contain', 'Event List');
      cy.get('.App').should('not.contain', 'Timer Control');
      cy.get('.App').should('not.contain', 'Messages Control');
      cy.get('.App').should('not.contain', 'Info');
    });
    it('self contained timercontrol', () => {
      cy.visit('http://localhost:4001/timercontrol');
      cy.get('.App').should('not.contain', 'Event List');
      cy.get('.App').should('contain', 'Timer Control');
      cy.get('.App').should('not.contain', 'Messages Control');
      cy.get('.App').should('not.contain', 'Info');
    });
    it('self contained messagecontrol', () => {
      cy.visit('http://localhost:4001/messagecontrol');
      cy.get('.App').should('not.contain', 'Event List');
      cy.get('.App').should('not.contain', 'Timer Control');
      cy.get('.App').should('contain', 'Messages Control');
      cy.get('.App').should('not.contain', 'Info');
    });
    it('self contained info', () => {
      cy.visit('http://localhost:4001/info');
      cy.get('.App').should('not.contain', 'Event List');
      cy.get('.App').should('not.contain', 'Timer Control');
      cy.get('.App').should('not.contain', 'Messages Control');
      cy.get('.App').should('contain', 'Info');
    });
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

describe('minimal timer and options', () => {
  it('renders base route', () => {
    // base route
    cy.visit('http://localhost:4001/minimal');
    cy.get('[data-testid="minimal-timer"]').should('exist');
    // ontime fallsback to stage timer on errors, so we check for that
    cy.get('.App').should('not.contain', 'Time Now');
  });

  it('renders with defined options', () => {
    // route with options
    cy.visit(
      'http://localhost:4001/minimal?font=arial=1&size=1.5&text=0f0&key=ff0&hideovertime=true&alignx=start&aligny=end&offsetx=100&offsety=-100&hidemessages=true'
    );
    cy.get('[data-testid="minimal-timer"]').should('exist');
    // ontime fallback to stage timer on errors, so we check for that
    cy.get('.App').should('not.contain', 'Time Now');
  });

  it('hides nav on given option', () => {
    // route with options for no nav
    cy.visit('http://localhost:4001/minimal?hidenav=true');
    cy.get('[data-testid="minimal-timer"]').should('exist');
    // ontime fallback to stage timer on errors, so we check for that
    cy.get('.App').should('not.contain', 'Time Now');
    cy.get('[data-testid="nav-logo"]').should('not.exist');
  });
});
