;(function() {
	
	new View('signin-service', {
		
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
				
				// iOS: prevent auto focusing the last field
				app.disableFields();
				
				// add service theming
				this.$el.removeClass('github facebook google twitter');
				this.$el.addClass(this._service);
				
				// ensure form state is not set to processing when view is visible (shouldn't ever happen but left for safety)
				this._processingForm = false;
				
				// iOS: Change status bar style to match view style
				app.changeStatusBarStyle('white');
				
				// populate form fields
				this.populateFields();
				
				// analytics
				app.trackEvent({ label: 'Signin Service', category: 'view', action: 'visible' });
				
				
			},
			hidden: function() {
				
				this._service = false;
				
				this.clearFields();
				
			}
		},
		
		buttons: {
			'.btn-right': 'previous',
			
			'.action-submit': 'validateSignup'
		},
		
		previous: function() {
			app.view('signin').reveal('slide-down', true);
		},
		
		populateFields: function() {
		
			var authUser = this._authUser;
			
			this.field('firstName').val(authUser.name.first);
			this.field('lastName').val(authUser.name.last);
			this.field('email').val(authUser.email);
			this.field('website').val(authUser.website);
		
		},
		
		clearFields: function() {
		
			var self = this;
			
			_.each(['firstName', 'lastName', 'email', 'website'], function(key) {
				self.field(key).val('');
			});
		
		},
		
		validateSignup: function() {
		
			var self = this;
			
			if (self._processingForm) {
				console.log('[validateInput] - User tried to submit form but is already in a processing state.');
				return;
			}
			
			self._processingForm = true;
			
			app.hideKeyboard();
			
			// Collect the form data
			var inputData = {
				'name.first': this.field('firstName').val(),
				'name.last': this.field('lastName').val(),
				email: this.field('email').val(),
				website: this.field('website').val(),
				alertsNotifications: this.field('alertsNotifications').val() == 'yes' ? true : false
			};
			
			// Log data
			console.log("[validateInput] - Input data to be processed:", inputData);
			
			// Validate the form data
			if (!inputData['name.first'].trim().length || !inputData['name.last'].trim().length) {
				self._processingForm = false;
				app.showNotification('Alert', 'Please enter your full name.');
				return;
			}
			
			if (!inputData.email.trim().length) {
				self._processingForm = false;
				app.showNotification('Alert', 'Please enter your email address.');
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
			
			console.log(userData);
			
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
				url: app.getAPIEndpoint('signin-service'),
				type: 'post',
				data: {
					authUser: this._authUser,
					form: userData
				},
				dataType: 'json',
				cache: false,
				success: function(data) {
					return data.success ? success(data) : error(data);
				},
				error: function() {
					return error();
				}
			});
			
		}
		
	});

})();
