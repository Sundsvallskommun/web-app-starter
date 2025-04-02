describe('Example page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should render correct html structure', () => {
    cy.get('main').should('be.visible');
    cy.get('h1').should('be.visible').should('contain.text', 'Välkommen Förnamn Efternamn!');
  });
});
