# Feedback service

Feedback service is used for sending user feedback from frontend app to appropriate backend service. Currently, supported
are GitHub, email and redmine. Every connection is stored inside service manager, so it can be reused in the future.
Decision behind this is future support for multitenancy and also having a possibility to support usage of multiple
feedbacks at the same time.
