// go through routes and make sure things render as expected
describe('validate routes', () => {
  describe('viewer routes', () => {
    it('default to stage timer', () => {
      cy.visit('http://localhost:4001/');
      cy.get('[data-testid="timer-view"]').should('exist');
      cy.contains('Time Now');
    });

    it('renders stage timer routes', () => {
      cy.visit('http://localhost:4001/timer');
      cy.get('[data-testid="timer-view"]').should('exist');
      cy.contains('Time Now');

      cy.visit('http://localhost:4001/presenter');
      cy.get('[data-testid="timer-view"]').should('exist');
      cy.contains('Time Now');

      cy.visit('http://localhost:4001/speaker');
      cy.get('[data-testid="timer-view"]').should('exist');
      cy.contains('Time Now');

      cy.visit('http://localhost:4001/stage');
      cy.get('[data-testid="timer-view"]').should('exist');
      cy.contains('Time Now');
    });

    it('renders backstage routes', () => {
      cy.visit('http://localhost:4001/backstage');
      cy.get('[data-testid="backstage-view"]').should('exist');
      cy.contains('Today');
      cy.contains('Time Now');
      cy.contains('Info');

      cy.visit('http://localhost:4001/sm');
      cy.get('[data-testid="backstage-view"]').should('exist');
      cy.contains('Today');
      cy.contains('Time Now');
      cy.contains('Info');
    });

    it('renders public view', () => {
      cy.visit('http://localhost:4001/public');
      cy.get('[data-testid="public-view"]').should('exist');
      cy.contains('Today');
      cy.contains('Time Now');
      cy.contains('Info');
    });

    it('renders pip view', () => {
      cy.visit('http://localhost:4001/pip');
      cy.get('[data-testid="pip-view"]').should('exist');
      cy.contains('Today');
    });

    it('renders lower third with no errors', () => {
      cy.visit('http://localhost:4001/lower');
      cy.get('[data-testid="error-container"]').should('not.exist');
    });

    it('renders lower third with no errors', () => {
      cy.visit('http://localhost:4001/lower');
      cy.get('[data-testid="error-container"]').should('not.exist');
    });

    it('renders studio clock', () => {
      cy.visit('http://localhost:4001/studio');
      cy.get('[data-testid="studio-view"]').should('exist');
      cy.contains('ON AIR');
    });

    it('renders countdown selection', () => {
      cy.visit('http://localhost:4001/countdown');
      cy.get('[data-testid="countdown-view"]').should('exist');
      cy.get('[data-testid="countdown-select"]').should('exist');
      cy.contains('Select an event to follow');
    });

    it('renders countdown with event', () => {
      cy.visit('http://localhost:4001/countdown?event=1');
      cy.get('[data-testid="countdown-view"]').should('exist');
      cy.get('[data-testid="countdown-event"]').should('exist');
      cy.contains('Time Now');
      cy.contains('Start Time');
      cy.contains('End Time');
    });
  });

  describe('clock view timer', () => {
    it('renders base route', () => {
      cy.visit('http://localhost:4001/clock');
      cy.get('[data-testid="clock-view"]').should('exist');
      cy.get('.App').should('not.contain', 'Time Now');
    });
  });

  describe('minimal timer and options', () => {
    it('renders base route', () => {
      cy.visit('http://localhost:4001/minimal');
      cy.get('[data-testid="minimal-timer"]').should('exist');
      cy.get('.App').should('not.contain', 'Time Now');
    });

    it('renders with defined options', () => {
      cy.visit(
        'http://localhost:4001/minimal?font=arial=1&size=1.5&text=0f0&key=ff0&hideovertime=true&alignx=start&aligny=end&offsetx=100&offsety=-100&hidemessages=true'
      );
      cy.get('[data-testid="minimal-timer"]').should('exist');
      cy.get('.App').should('not.contain', 'Time Now');
    });

    it('hides nav on given option', () => {
      cy.visit('http://localhost:4001/minimal?hidenav=true');
      cy.get('[data-testid="minimal-timer"]').should('exist');
      cy.get('.App').should('not.contain', 'Time Now');
      cy.get('[data-testid="nav-logo"]').should('not.exist');
    });
  });

  describe('editor routes', () => {
    it('app editor', () => {
      cy.visit('http://localhost:4001/editor');
      cy.get('[data-testid="event-editor"]').should('exist');
      cy.get('[data-testid="panel-event-list"]').should('exist');
      cy.get('[data-testid="panel-timer-control"]').should('exist');
      cy.get('[data-testid="panel-messages-control"]').should('exist');
      cy.get('[data-testid="panel-info"]').should('exist');
    });
    it('self contained eventlist', () => {
      cy.visit('http://localhost:4001/eventlist');
      cy.get('[data-testid="panel-event-list"]').should('exist');
      cy.get('[data-testid="panel-timer-control"]').should('not.exist');
      cy.get('[data-testid="panel-messages-control"]').should('not.exist');
      cy.get('[data-testid="panel-info"]').should('not.exist');
    });
    it('self contained timercontrol', () => {
      cy.visit('http://localhost:4001/timercontrol');
      cy.get('[data-testid="panel-event-list"]').should('not.exist');
      cy.get('[data-testid="panel-timer-control"]').should('exist');
      cy.get('[data-testid="panel-messages-control"]').should('not.exist');
      cy.get('[data-testid="panel-info"]').should('not.exist');
    });
    it('self contained messagecontrol', () => {
      cy.visit('http://localhost:4001/messagecontrol');
      cy.get('[data-testid="panel-event-list"]').should('not.exist');
      cy.get('[data-testid="panel-timer-control"]').should('not.exist');
      cy.get('[data-testid="panel-messages-control"]').should('exist');
      cy.get('[data-testid="panel-info"]').should('not.exist');
    });
    it('self contained info', () => {
      cy.visit('http://localhost:4001/info');
      cy.get('[data-testid="panel-event-list"]').should('not.exist');
      cy.get('[data-testid="panel-timer-control"]').should('not.exist');
      cy.get('[data-testid="panel-messages-control"]').should('not.exist');
      cy.get('[data-testid="panel-info"]').should('exist');
    });
  });

  it('table routes', () => {
    cy.visit('http://localhost:4001/table');
    cy.contains('Running Timer');
    cy.get('[data-testid="cuesheet"]').should('exist');

    cy.visit('http://localhost:4001/cuesheet');
    cy.contains('Running Timer');
    cy.get('[data-testid="cuesheet"]').should('exist');

    cy.visit('http://localhost:4001/cuelist');
    cy.contains('Running Timer');
    cy.get('[data-testid="cuesheet"]').should('exist');
  });
});
