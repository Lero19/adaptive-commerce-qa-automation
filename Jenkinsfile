
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

        stage('Registration Test') {
            steps {
                bat 'npm run test:registration'
            }
        }
    }

    post {
        always {
            script {
                if (fileExists('allure-results')) {
                    try {
                        bat 'npm run allure:generate'
                    } catch (err) {
                        echo "Allure report generation failed: ${err}"
                    }

                    try {
                        allure([
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
                artifacts: 'allure-results/**,allure-report/**',
                allowEmptyArchive: true,
                fingerprint: true
            )
        }

        success {
            echo 'Registration automation passed.'
        }

        failure {
            echo 'Registration automation failed. Check the console output and archived results.'
        }
    }
}
