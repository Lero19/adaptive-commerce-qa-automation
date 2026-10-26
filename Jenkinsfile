pipeline {
    agent any

    triggers {
        // Three scheduled runs daily.
        cron('0 8,13,18 * * *')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        skipDefaultCheckout(true)
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                bat 'git status --short'
            }
        }

        stage('Verify Environment') {
            steps {
                bat 'node --version'
                bat 'npm --version'
                bat 'java -version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Install Chromium') {
            steps {
                bat 'npx playwright install chromium'
            }
        }

        stage('TypeScript Validation') {
            steps {
                bat 'npm run typecheck'
            }
        }

        stage('Clean Allure Results') {
            steps {
                bat 'npm run clean:allure'
            }
        }

        stage('Registration Test') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'testuser',
                        usernameVariable: 'TEST_USER_EMAIL',
                        passwordVariable: 'TEST_USER_PASSWORD'
                    )
                ]) {
                    bat 'npm run test:registration'
                }
            }
        }

        stage('Login & Authentication Tests') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'testuser',
                        usernameVariable: 'TEST_USER_EMAIL',
                        passwordVariable: 'TEST_USER_PASSWORD'
                    )
                ]) {
                    bat 'npm run test:login'
                }
            }
        }
    }
        post {
        always {
            script {
                if (fileExists('allure-results')) {
                    try {
                        allure([
                            commandline: 'allure-2.46.1',
                            includeProperties: false,
                            results: [[path: 'allure-results']]
                        ])
                    } catch (err) {
                        echo "Allure publishing failed: ${err}"
                    }
                } else {
                    echo 'No Allure results were generated.'
                }
            }

            archiveArtifacts(
                artifacts: 'allure-results/**',
                allowEmptyArchive: true,
                fingerprint: true
            )
        }

        success {
            echo 'Registration and authentication automation passed.'
        }

        failure {
            echo 'Automation failed. Check the console output and archived results.'
        }
    }
}