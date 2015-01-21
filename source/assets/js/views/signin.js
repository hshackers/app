;(function() {
	
	new View('signin', {
		
		on: {
			layout: function() {},
			visible: function() {
				
				var self = this;
				
				this.$('.titlebar').css('height', parseInt(this.$('.titlebar .wrap').css('height'), 10) + this.$('.statusbar').height());
				
				var availableHeight = app.viewportSize.height
					- this.$('.titlebar').height();
					
				this.$('.container').css({
					height: availableHeight,
					top: this.$('.titlebar').height()
				});
				
				setTimeout(function() {
					self.animateView();
				}, 150);
				
				// iOS: Change status bar style to match view style
				app.changeStatusBarStyle('white');
				
				// analytics
				app.trackEvent({ label: 'Signin', category: 'view', action: 'visible' });
				
			},
			hidden: function() {}
		},
		
		buttons: {
			'.btn-right': 'previous',
			'.btn-github': 'serviceSignin',
			'.btn-facebook': 'serviceSignin',
			'.btn-google': 'serviceSignin',
			'.btn-twitter': 'serviceSignin',
			'.btn-email': 'emailSignin'
		},
		
		previous: function() {
			app.view('home').reveal('slide-down');
		},
		
		animateView: function() {
			
			var self = this;
			
			var availableHeight = app.viewportSize.height
				- this.$('.titlebar').height();
			
			var types = ['github', 'facebook', 'google', 'twitter', 'email'];
			
			_.each(types, function(button, index) {
			
				var $button = self.$('.btn-' + button);
				
				var spacing = Math.ceil(availableHeight / 5),
					height = Math.ceil(availableHeight) - (index + 1 != types.length ? (spacing * (index - 1)) + spacing : (spacing * 4 - (spacing * 1)));
				
				$button.css({
					top: availableHeight,
					height: height
				});
				
				$button.find('.action').css('height', spacing);
				
				$button.velocity({
					top: spacing * index
				}, { delay: index * 100, duration: 1000, easing: [600, 30] }); 
				
			});
		},
		
		emailSignin: function() {
			app.view('signin-email').show('slide-up');
		},
		
		serviceSignin: function(el) {
			
			var self = this;
			
			var service = $(el.target).data().service;
			self._service = service;
			
			var options = 'location=no,toolbar=yes,toolbarposition=top,closebuttoncaption=Cancel';
			
			var authWindow = window.open(config.baseURL + '/auth/' + service + '?target=app&version=' + app.data.version, '_blank', options);
			
			authWindow.addEventListener('loadstop', function() {
				
				var checkAuthUser = setInterval(function() {
					
					authWindow.executeScript({ code: "localStorage.getItem('authUser')" },
						
						function(data) {
							
							var authUser = _.first(data);
							
							if (!authUser) return;
							
							clearInterval(checkAuthUser);
							
							authWindow.close();
							
							self._authUser = JSON.parse(authUser);
							
							self.checkExisting();
							
						}
					);
					
				}, 100);
				
			});
			
		},
		
		checkExisting: function() {
		
			var self = this;
			
			var success = function(data) {
				
				console.log("[checkExisting] - Processed succesfully, showing message.", data);
				
				// Hide loading spinner
				app.hideLoadingSpinner();
				
				if (data.session) {
					
					// Put data in local storage
					app.storeSessionInfo(data);
					
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
							app.view('signin-successful').show('slide-up');
						});
					});
					
				} else {
					
					// Pass through data
					app.view('signin-service')._service = self._service;
					app.view('signin-service')._authUser = self._authUser;
					
					app.view('signin-service').show('slide-up');
					
				}
				
			}
			
			var error = function(data) {
			
				console.log("[checkExisting] - Update failed, advise user to retry details.", data);
				
				// Hide loading spinner
				app.hideLoadingSpinner();
				
				// Show message
				app.showNotification('Alert', 'Sorry, your account could not be processed. Please try again.' + (data && data.message && data.message.length ? '\n\n' + data.message : ''));
			
			}
			
			$.ajax({
				url: app.getAPIEndpoint('signin-service-check'),
				type: 'post',
				data: {
					authUser: this._authUser
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
