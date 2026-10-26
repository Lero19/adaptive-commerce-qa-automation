@registration
Feature: Customer registration

  As a prospective customer
  I want to create a web shop account
  So that I can access customer shopping features

  # Data conventions for the Examples tables:
  #   random -> a unique value is generated for the run
  #   match  -> (confirmPassword) reuse the password that was used/generated above
  #   empty  -> the field is intentionally left blank

  Background:
    Given I am on the web shop home page
    When I open the registration form from the header

  @smoke @positive
  Scenario Outline: Register a new customer successfully
    When I register as a "<gender>" customer named "<firstName>" "<lastName>" with email "<email>", password "<password>" and confirm password "<confirmPassword>"
    Then my registration should complete successfully
    And I should be logged in with my new account

    Examples: Randomly generated customers
      | gender | firstName | lastName | email  | password | confirmPassword |
      | male   | random    | random   | random | random   | match           |
      | female | random    | random   | random | random   | match           |

    Examples: Known customer details with a generated email
      | gender | firstName | lastName | email  | password    | confirmPassword |
      | female | Thandi    | Mokoena  | random | Passw0rd!23 | match           |

  @negative
  Scenario Outline: Reject a registration with missing required fields
    When I register as a "<gender>" customer named "<firstName>" "<lastName>" with email "<email>", password "<password>" and confirm password "<confirmPassword>"
    Then the registration should be rejected with validation feedback
    And I should see the validation message "<message>"

    Examples:
      | gender | firstName | lastName | email  | password | confirmPassword | message                  |
      | male   |           | random   | random | random   | match           | First name is required.  |
      | female | random    |          | random | random   | match           | Last name is required.   |
      | male   | random    | random   |        | random   | match           | Email is required.       |
      | female | random    | random   | random |          |                 | Password is required.    |

  @negative
  Scenario Outline: Reject mismatched passwords
    When I register as a "<gender>" customer named "<firstName>" "<lastName>" with email "<email>", password "<password>" and confirm password "<confirmPassword>"
    Then the registration should be rejected with validation feedback
    And I should see the validation message "<message>"

    Examples:
      | gender | firstName | lastName | email  | password | confirmPassword | message                                              |
      | male   | random    | random   | random | random   | Different#456   | The password and confirmation password do not match. |