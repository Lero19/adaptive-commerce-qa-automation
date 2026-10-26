@authentication
Feature: Customer authentication and account access
  As a registered customer
  I want secure and reliable access to my account
  So that I can manage my personal details and use the web shop's shopping features

  Background:
    Given I am on the web shop home page

  @smoke @positive @critical
  Scenario Outline: Grant account access to a registered customer with valid credentials
    When I open the login form from the header
    And I authenticate using a registered customer's "<credentialType>" and valid password
    Then access to the customer account should be granted
    And the authenticated customer's identity should be displayed in the header

    Examples: Supported login identifiers
      | credentialType |
      | email          |

  @negative @security
  Scenario Outline: Protect customer accounts against invalid authentication attempts
    When I open the login form from the header
    And I attempt to authenticate using my configured email and password "<password>"
    Then access to the customer account should be denied
    And an appropriate authentication error should be displayed
    And the customer should remain unauthenticated

    Examples: Invalid credentials
      | password             |
      | WrongPassword123!    |
      | InvalidCredential456!|

  @positive @account-recovery
  Scenario: Allow a customer to access the password recovery process
    When I open the login form from the header
    And I open the forgot password form
    Then the password recovery form should be displayed
    And the customer should be able to provide their registered email address

  @positive @account-recovery
  Scenario: Submit a password recovery request for a registered customer
    When I open the password recovery form
    And I submit my configured test email address for password recovery
    Then the password recovery request should be acknowledged
    And the customer should receive appropriate next-step guidance