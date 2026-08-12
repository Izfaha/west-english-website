pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        COMPOSE_PROJECT_NAME = 'west-website'
    }

    stages {
        // code checking
        stages('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        // cheking docker compose syntax 
        stages('Validate') {
            steps {
                echo 'Validating Docker Compose...'
                sh ```
                    docker compose config --dry-run
                ```
            }
        }

        // local deployment no image building
        stages('Deploy on Local...') {
            steps {
                sh ```
                    docker compose up -d --remove-orphans
                ```
            }
        }
    }

    post {
        success {
            echo 'West web localdeployment successful!'
        }

        failure {
            echo 'West web pipeline failed!'
        }
    }
}