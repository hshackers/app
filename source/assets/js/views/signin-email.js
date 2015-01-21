;(function() {
	
	new View('signin-email', {
		
		on: {
			layout: function() {
				
				// iOS/Desktop cater for statusbar height
				if (!app._device.system || app._device.system == 'ios') {
					this.$('.titlebar').css('height', parseInt(this.$('.titlebar .wrap').css('height'), 10) + 21);
				}
				
				// iOS: fixes the scrolling & rendering issue when previous/nexting through fields
				if (app._device.system == 'ios' && document.activeElement.tagName.toLowerCase().match(/input|textarea|select/)) {
					return;
				}
				
				// calculate available height
				var availableHeight = app.viewportSize.height
					- this.$('.titlebar').height();
				
				// set height and position of main container to availabe height
				this.$('.container').css({
					height: availableHeight,
					top: this.$('.titlebar').height()
				});
				
			},
			visible: function() {
				
				// make sure the signin flow is shown
				this._flow = 'signin';
				this.$('.signin.container').css('opacity', 1).show();
				this.$('.signup.container').hide();
				this.$('.recover.container').hide();
				
				// iOS: prevent auto focusing the last field
				app.disableFields();
				
				// Ensure form state is not set to processing when view is visible (shouldn't ever happen but left for safety)
				this._processingForm = false;
				
				// iOS: Change status bar style to match view style
				app.changeStatusBarStyle('black');
				
				// analytics
				app.trackEvent({ label: 'Signin Email', category: 'view', action: 'visible' });
				
				
			},
			hidden: function() {
				
				this.clearFields();
				
			}
		},
		
		buttons: {
			'.btn-right': 'previous',
			
			'.signin .action-submit': 'validateSignin',
			'.signin .action-recover': 'showRecover',
			'.signin .action-signup': 'showSignup',
			
			'.signup .action-submit': 'validateSignup',
			'.signup .action-signin': 'showSignin',
			
			'.recover .action-submit': 'validateRecover',
			'.recover .action-signin': 'showSignin'
		},
		
		previous: function() {
			app.view('signin').reveal('slide-down', true);
		},
		
		clearFields: function() {
		
			var self = this;
			
			// TODO: Check switcher being reset
			
			var fields = [];
				fields.push('signin-email', 'signin-password');
				fields.push('signup-firstName', 'signup-lastName', 'signup-email', 'signup-password', 'signup-website', 'signup-alertsNotifications');
				fields.push('recover-email');
			
			_.each(fields, function(key) {
				self.field(key).val('');
			});
		
		},
		
		switchFlow: function(flow) {
			
			var self = this;
			
			// iOS: prevent auto focusing the last field
			app.disableFields();
			
			// hide and show the desired flow
			this.$('.' + this._flow + '.container').velocity({
				opacity: 0
			}, {
				duration: 150,
				easing: 'easeOutSine',
				complete: function() {
					
					self.clearFields();
					
					self.$('.' + flow + '.container').css('opacity', 0).show();
					self.$('.' + flow + '.container').velocity({
						opacity: 1
					}, {
						duration: 150,
						easing: 'easeOutSine',
						complete: function() {
							self.$('.' + self._flow + '.container').hide();
							self._flow = flow;
						}
					});
					
				}
			});
			
		},
		
		showSignup: function() {
			this.switchFlow('signup');
		},
		
		showSignin: function() {
			this.switchFlow('signin');
		},
		
		showRecover: function() {
			this.switchFlow('recover');
		},
		
		// Validate input and tokenise the card
		validateSignin: function() {
		
			var self = this;
			
			if ( self._processingForm ) {
				console.log('[validateInput] - User tried to submit form but is already in a processing state.');
				return;
			}
			
			self._processingForm = true;
			
			app.hideKeyboard();
			
			// Collect the form data
			var inputData = {
				username: this.field('signin-email').val(),
				password: this.field('signin-password').val()
			};
			
			// Log data
			console.log("[validateInput] - Input data to be processed:", inputData);
			
			// Validate the form data
			if (!inputData.username.trim().length) {
				self._processingForm = false;
				app.showNotification('Alert', 'Please enter your email.');
				return;
			}
			 
			if (!inputData.password.trim().length) {
				self._processingForm = false;
				app.showNotification('Alert', 'Please enter your password.');
				return;
			}
			
			console.log("[validateInput] - Input data passed all validation checks, saving data...");
			
			// Show loading spinner
			app.showLoadingSpinner();
			
			// Sign user in
			this.actionSignin(inputData);
		
		},
		
		// Process the yser
		actionSignin: function(userData) {
		
			var self = this;
			
			console.log("[signinUser] - User data to be processed:", userData);
			
			console.log("[signinUser] - Processing data...");
			
			var success = function(data) {
				
				console.log("[signinUser] - Password check successful.", data);
				
				// Put data in local storage
				app.storeSessionInfo(data);
				
				// Set form to no longer processing
				self._processingForm = false;
				
				// Go to another view
				app.getStatus(function(err) {
					if (err) {
						app.showNotification('Oops!', 'There was an error communicating with HS Hackers, please wait while we attempt to re-connect in 5 seconds.');
						app.showLoadingSpinner('Retrying');
						setTimeout(function() {
							success(data);
						}, 5000);
						return;
					}
					app.preloadUser(function() {
						app.hideLoadingSpinner();
						app.view('signin-successful').show('slide-up');
					});
				});
			
			}
			
			var error = function(data) {
				
				console.log("[signinUser] - Password check failed, advise user to retry details.", data);
				
				// Hide loading spinner
				app.hideLoadingSpinner();
				
				// Set form to no longer processing
				self._processingForm = false;
				
				// Reset and focus field
				self.field('password').val('');
				setTimeout(function() {
					self.field('password').focus();
				}, 100);
				
				// Show message
				app.showNotification('Alert', 'Sorry, we couldn\'t validate your password, please try again.' + (data && data.message && data.message.length ? '\n\n' + data.message : ''));
				
			}
			
			$.ajax({
				url: app.getAPIEndpoint('signin-email'),
				type: 'post',
				data: userData,
				dataType: 'json',
				cache: false,
				success: function(data) {
					data && data.success && data.session ? success(data) : error(data);
				},
				error: function() {
					return error();
				}
			});
			
		},
		
		validateSignup: function() {
		
			var self = this;
			
			if ( self._processingForm ) {
				console.log('[validateInput] - User tried to submit form but is already in a processing state.');
				return;
			}
			
			self._processingForm = true;
			
			app.hideKeyboard();
			
			// Collect the form data
			var inputData = {
				'name.first': this.field('signup-firstName').val(),
				'name.last': this.field('signup-lastName').val(),
				email: this.field('signup-email').val(),
				password: this.field('signup-password').val(),
				website: this.field('signup-website').val(),
				alertsNotifications: this.field('signup-alertsNotifications').val() == 'yes' ? true : false
			};
			
			// Log data
			console.log("[validateInput] - Input data to be processed:", inputData);
			
			// Validate the form data
			if (!inputData['name.first'].trim().length || !inputData['name.first'].trim().length) {
				self._processingForm = false;
				app.showNotification('Alert', 'Please enter your full name.');
				return;
			}
			
			if (!inputData.email.trim().length) {
				self._processingForm = false;
				app.showNotification('Alert', 'Please enter your email address.');
				return;
			}
			
			if (!inputData.password.trim().length) {
				self._processingForm = false;
				app.showNotification('Alert', 'Please enter a password.');
				return;
			}
			
			console.log("[validateInput] - Input data passed all validation checks, saving data...");
			
			// Show loading spinner
			app.showLoadingSpinner();
			
			// Save details
			this.actionSignup(inputData);
		
		},
		
		actionSignup: function(userData) {
		
			var self = this;
			
			console.log("[saveDetails] - User data to be processed:", userData);
			console.log("[saveDetails] - Processing data...");
			
			var success = function(data) {
				
				console.log("[saveDetails] - Processed succesfully, showing message.", data);
				
				// Put data in local storage
				app.storeSessionInfo(data);
				
				// Set form to no longer processing
				self._processingForm = false;
				
				// Go to another view
				app.getStatus(function(err) {
					if (err) {
						app.showNotification('Oops!', 'There was an error communicating with HS Hackers, please wait while we attempt to re-connect in 5 seconds.');
						app.showLoadingSpinner('Retrying');
						setTimeout(function() {
							success(data);
						}, 5000);
						return;
					}
					app.preloadUser(function() {
						app.hideLoadingSpinner();
						app.view('signin-successful').show('slide-up');
						app.view('signin-email').clearFields();
					});
				});
				
			}
			
			var error = function(data) {
				
				console.log("[saveDetails] - Update failed, advise user to retry details.", data);
				
				// Hide loading spinner
				app.hideLoadingSpinner();
				
				// Set form to no longer processing
				self._processingForm = false;
				
				// Show message
				app.showNotification('Alert', 'Sorry, your account could not be created. Please try again.' + (data && data.message && data.message.length ? '\n\n' + data.message : ''));
				
			}
			
			$.ajax({
				url: app.getAPIEndpoint('signup-email'),
				type: 'post',
				data: userData,
				dataType: 'json',
				cache: false,
				success: function(data) {
					return data.success ? success(data) : error(data);
				},
				error: function() {
					return error();
				}
			});
			
		},
		
		// Validate recover
		validateRecover: function() {
		
			var self = this;
			
			if ( self._processingForm ) {
				console.log('[validateInput] - User tried to submit form but is already in a processing state.');
				return;
			}
			
			self._processingForm = true;
			
			app.hideKeyboard();
			
			// Collect the form data
			var inputData = {
				email: this.field('recover-email').val()
			};
			
			// Log data
			console.log("[validateInput] - Input data to be processed:", inputData);
			
			// Validate the form data
			if (!inputData.email.trim().length) {
				self._processingForm = false;
				app.showNotification('Alert', 'Please enter your email address.');
				return;
			}
			
			console.log("[validateInput] - Input data passed all validation checks, saving data...");
			
			// Show loading spinner
			app.showLoadingSpinner();
			
			// Sign user in
			this.actionRecover(inputData);
		
		},
		
		// Process the yser
		actionRecover: function(userData) {
		
			var self = this;
			
			console.log("[actionRecover] - User data to be processed:", userData);
			
			console.log("[actionRecover] - Processing data...");
			
			var success = function(data) {
				
				console.log("[actionRecover] - Reset password successful.", data);
				
				// Hide loading spinner
				app.hideLoadingSpinner();
				
				// Set form to no longer processing
				self._processingForm = false;
				
				// Show alert message
				app.showNotification('Alert', 'Your password has been reset, please check your email to continue.');
				
				// Go to another view
				self.switchFlow('signin');
			
			}
			
			var error = function(data) {
				
				console.log("[signinUser] - Reset password failed, advise user to retry details.", data);
				
				// Hide loading spinner
				app.hideLoadingSpinner();
				
				// Set form to no longer processing
				self._processingForm = false;
				
				// Reset and focus field
				self.field('recover-email').val('');
				setTimeout(function() {
					self.field('recover-email').focus();
				}, 100);
				
				// Show message
				app.showNotification('Alert', 'Sorry, we couldn\'t reset your password, please try again.' + (data && data.message && data.message.length ? '\n\n' + data.message : ''));
				
			}
			
			$.ajax({
				url: app.getAPIEndpoint('signin-recover'),
				type: 'post',
				data: userData,
				dataType: 'json',
				cache: false,
				success: function(data) {
					data && data.success ? success(data) : error(data);
				},
				error: function() {
					return error();
				}
			});
			
		}
		
	});

})();
