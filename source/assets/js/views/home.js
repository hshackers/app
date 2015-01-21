;(function() {
	
	new View('home', {
		
		on: {
			layout: function() {
				
				var availableHeight = app.viewportSize.height -
					this.$('.statusbar').height();
				
				this.$('.container').css({
					height: availableHeight,
					top: this.$('.statusbar').height()
				});
				
				this.$('.corners').css({
					top: this.$('.statusbar').height()
				});
				
				this.$('.menu').css({
					height: app.viewportSize.height
				});
				
			},
			visible: function() {
				
				var self = this;
				
				this.setBackground();
				this.showBackground();
				
				this.animateView();
				
				this.setNotifications();
				this.setMeetup(true);
				this.setState();
				this.setSession();
				
				// render the talks view after a slight delay so it's ready for us
				setTimeout(function() {
					!app.view('talks')._renderedTalks && app.view('talks').renderTalks();
				}, 1250);
				
				// preload green notifications icon
				var $image = $(new Image());
					$image.prop('src', 'img/ui/icon-alarm-green.svg');
				
				// check for a pending action (if a user clicked attend/not attend and
				// they come back from signup)
				if (this._action) {
					if (_.isEmpty(app.data.session)) return this._action = undefined;
					if (app.data.meetups.next && app.data.rsvp.responded) return this._action = undefined;
					setTimeout(function() {
						switch(self._action) {
							case 'attending': self.rsvpAttending(); break;
							case 'notAttending': self.rsvpNotAttending(); break;
						}
						self._action = undefined;
					}, 750);
				}
				
				// add shake event for easter egg
				this._shakes = 0;
				if (window.shake) {
					window.shake.startWatch(function() {
						self._shakes++;
						if (self._shakes == 3) {
							setTimeout(function() { self.easterEgg(); }, 500);
							if (navigator.notification && navigator.notification.vibrate) navigator.notification.vibrate(1000);
							self._shakes = 0;
						}
					});
				}
				
				// iOS: Change status bar style to match view style
				app.changeStatusBarStyle('white');
				
				// analytics
				app.trackEvent({ label: 'Home', category: 'view', action: 'visible' });
				
			},
			
			hidden: function() {
			
				// make sure menu is hidden
				this.toggleMenu(true);
				
				// destroy the background effect
				this.destroyBackground();
				
				// stop watching for shake event
				if (window.shake) window.shake.stopWatch();
				
				// hide any squid
				this.$('.squid').hide();
			
			}
		},
		
		buttons: {
			'.corners .btn-menu': 'toggleMenu',
			'.corners .btn-logo': 'viewTalks',
			'.corners .btn-notifications': 'toggleNotifications',
			
			'.home .btn-meetup': 'viewTalks',
			'.home .actions .btn-talks': 'viewTalks',
			'.home .actions .btn-calendar': 'addToCalendar',
			
			'.home .rsvp .btn-left': 'leftRSVP',
			'.home .rsvp .btn-right': 'rightRSVP',
			
			'.home .rsvp-not-attending .btn-cancel': 'rsvpCancel',
			'.home .rsvp-attending .btn-cancel': 'rsvpCancel',
			
			'.menu .btn-join': 'menuJoin',
			'.menu .btn-signout': 'menuSignout',
			'.menu .btn-about': 'menuAbout',
			'.menu .about .close': 'menuAboutBack',
			'.menu .btn-credits': 'menuCredits',
			'.menu .credits .close': 'menuCreditsBack',
			
			'.link': 'openLink'
		},
		
		setBackground: function() {
			
			var $background = this.$('.background'),
				$image = $background.find('.image');
			
			$background.css('margin-left', -805 - 35);
			$background.css('margin-top', (-(1073.5 / 4) - 35) + 50);
			
			if (window.DeviceOrientationEvent) {
				
				$(window).on('deviceorientation', function(e) {
					
					var beta = e.originalEvent.beta,
						gamma = e.originalEvent.gamma;
					
					var pad = 50;
					
					if (gamma > 90) gamma = 180 - gamma;
					if (gamma < -90) gamma = -180 - gamma;
					
					var yTilt = -beta / 180 * pad;
					var xTilt = -gamma / 180 * pad;
					
					// console.log('beta: ' + beta.toFixed(1) + '\ngamma: ' + gamma.toFixed(1) + '\nyTilt: ' + yTilt + '\nxTilt: ' + xTilt);
					
					var position = 'translate3d(' + xTilt + 'px, ' + yTilt + 'px, ' + pad + 'px)';
					
					_.first($image).style.transform = position;
					_.first($image).style.webkitTransform = position;
					
				});
				
			}
			
			
		},
		
		showBackground: function() {
			// velocity causes visual artifacts if it's used for opacity
			// using a standard css transition here
			this.$('.background').addClass('show');
		},
		
		destroyBackground: function() {
			$(window).off('deviceorientation');
		},
		
		animateView: function() {
		
			var self = this;
			
			if (this._animated) return;
			
			var meetup = app.parseMeetup(),
				rsvp = app.data.rsvp;
			
			var availableHeight = app.viewportSize.height - this.$('.statusbar').height();
			
			// If it's the first time this view is visible, animate the elements in
			var logoHeight = this.$('.logo').height(),
				meetupHeight = this.$('.meetup').height();
			
			var logoPosition = (availableHeight / 2) - (this.$('.logo').height() / 2) - this.$('.statusbar').height();
			
			this.$('.corners').css({ 'transform': 'translateY(-15px)', opacity: 0 });
			this.$('.home .logo').css('marginTop', logoPosition);
			this.$('.home .remaining').css('transform', 'translateY(' + app.viewportSize.height + 'px)');
			this.$('.home .states').css('transform', 'translateY(' + app.viewportSize.height + 'px)');
			
			this.$('.home .logo').show();
			this.$('.home .meetup').css('opacity', 0);
			this.$('.home .remaining').hide();
			
			app._device.size && app._device.size == 'short' && this.$('.meetup').addClass('short');
			
			this.$('.home .logo').velocity({
				opacity: 0
			}, {
				duration: 300, easing: 'easeOut', complete: function() {
				
				self.$('.home .meetup').css({
					marginTop: ((availableHeight / 2) - (self.$('.meetup').height() / 2) - self.$('.statusbar').height()) - self.$('.remaining').height() + 10
				});
				
				setTimeout(function() {
					self.$('.corners').velocity({ translateY: [0, -15], opacity: 1 }, { duration: 500, easing: 'easeOutSine' });
				}, 400);
				
				setTimeout(function() {
					self.$('.home .meetup').velocity({ opacity: 1 }, { duration: 500, easing: 'easeOutSine' });
				}, 200);
				
				setTimeout(function() {
					self.$('.home .states').velocity({ translateY: [app.viewportSize.height - 75 - self.$('.statusbar').height(), app.viewportSize.height] }, { duration: 500, easing: 'easeOutSine', complete: function() {
						if (meetup.next && meetup.data.ticketsRemaining && !rsvp.responded) self.animateRemaining();
					}});
				}, 300);
				
			}});
			
			this._animated = true;
		
		},
		
		animateRemaining: function(hide) {
			
			var self = this;
			
			if (hide && !this.$('.remaining:visible').length) return;
			
			var translateY = [app.viewportSize.height - 75 - this.$('.statusbar').height() - 35, app.viewportSize.height - 75 - self.$('.statusbar').height()]
			
			if (hide) {
				translateY.reverse();
			} else {
				this.$('.remaining .text').html(app.data.meetups.next.ticketsRemaining + ' Tickets Remaining');
				this.$('.remaining').css('transform', 'translate3d(-50%, ' + translateY + 'px)').show();
			}
			
			this.$('.remaining').velocity({
				translateX: ['-50%', '-50%'],
				translateY: translateY
			}, { duration: 250, easing: 'easeOutSine', complete: function() {
				if (hide) self.$('.remaining').hide();
			}});
			
		},
		
		toggleMenu: function(hideOnly) {
			
			var self = this;
			
			if (this._menuOpen) {
				this.$('.btn-menu .cross').removeClass('open');
				this.$('.corners .btn-logo, .corners .btn-notifications').velocity({
					opacity: 1
				}, { duration: 250, easing: 'easeOutSine' });
				this.$('.menu').velocity({
					opacity: 0
				}, { duration: 250, easing: 'easeOutSine', complete: function() {
					self.$('.menu').hide();
				}});
				this._menuOpen = false;
				this.setBackground();
				return;
			}
			
			if (typeof hideOnly == 'boolean') return;
			
			this.destroyBackground();
			
			this._menuOpen = true;
			
			var availableHeight = app.viewportSize.height - this.$('.statusbar').height();
			
			this.$('.corners .btn-logo, .corners .btn-notifications').velocity({ opacity: 0 }, { duration: 250, easing: 'easeOutSine' });
			
			this.$('.menu .about').hide();
			this.$('.menu .credits').hide();
			
			this.$('.menu').css({ 'background-color': '#2697de', 'opacity': 0 }).show();
			
			this.$('.buttons').css({ transform: 'translateY(' + ((availableHeight / 2) - (this.$('.buttons').height() / 2) + this.$('.statusbar').height()) + 'px)' });
			
			this.$('.btn-menu .cross').addClass('open');
			
			this.$('.menu').velocity({
				opacity: 1
			}, { duration: 250, easing: 'easeOutSine' });
			
		},
		
		toggleNotifications: function() {
		
			if (!app._device.system || !app._device.system.match(/ios|android/)) {
				app.hideLoadingSpinner();
				return app.showNotification('Alert', 'Sorry, notification functionality can only be configured on actual devices.');
			}
			
			var self = this;
			
			var pushNotifications = app.data.user.pushNotifications;
			
			var $notifications = this.$('.btn-notifications');
			
			if (pushNotifications) {
				app.showLoadingSpinner();
				app.disableNotifications(function() {
					self.setNotifications();
					app.hideLoadingSpinner();
				});
			} else {
				app.showConfirm('Notifications', 'Would you like to receive push notifications when new meetups are announced?', ['No, thanks', 'Notify Me'], function(pressed) {
					switch(pressed) {
						case 1: // No
							// app.showNotification('Alert', 'User declined enable notifications.');
						break;
						case 2: // Yes
							app.showLoadingSpinner();
							app.enableNotifications(function() {
								self.setNotifications();
								app.hideLoadingSpinner();
								$notifications.velocity({ rotateZ: ['15deg','-15deg'] }, { duration: 100, easing: 'easeInOut', loop: 5, complete: function() {
									$notifications.velocity({ rotateZ: '0deg' }, { duration: 100, easing: 'easeOut', complete: function() {
										$notifications.css({ transform: 'rotateX(0deg)' });
									}});
								}});
							});
						break;
					}
				});
			}
		
		},
		
		viewTalks: function() {
			this.destroyBackground();
			app.view('talks').show('slide-up');
		},
		
		setNotifications: function() {
			
			var pushNotifications = app.data.user.pushNotifications;
			
			var $notifications = this.$('.btn-notifications');
			
			$notifications.html('<img src="img/ui/icon-alarm-white.svg" />');
			
			if (pushNotifications) {
				$notifications.html('<img src="img/ui/icon-alarm-green.svg" />');
			}
		
		},
		
		setMeetup: function(initial) {
			
			var meetup = app.parseMeetup(),
				rsvp = app.data.rsvp;
			
			var $state = this.$('.meetup-state').show(),
				$name = this.$('.meetup-name').show(),
				$days = this.$('.meetup-days').show(),
				$date = this.$('.meetup-date').show(),
				$place = this.$('.meetup-place').show();
			
			var $calendar = this.$('.btn-calendar');
			
			var startDate = meetup.data.starts ? moment(meetup.data.starts) : false,
				endDate = meetup.data.ends ? moment(meetup.data.ends) : false;
			
			$state.html((meetup.next ? 'Next' : 'Last') + ' Meetup');
			$name.html(meetup.data.name);
			$days.html(meetup.next && (meetup.inProgress || startDate) ? (meetup.inProgress ? 'Now' : startDate.fromNow(true)) : '');
			$date.html(startDate ? startDate.format('ddd, DD MMM') + ' &#8212; ' + startDate.format('h:mma') + '-' + endDate.format('h:mma') : '');
			$place.html(meetup.data.map || 'Level 6, 341 George St');
			
			$calendar.find('.number').html(meetup.next && meetup.data.starts ? startDate.format('DD') : '');
			
			if (!meetup.next) $days.hide();
			if (!initial && !meetup.next) this.$('.remaining').hide();
			
			if (meetup.next && meetup.data.ticketsRemaining) this.$('.remaining .text').html(meetup.data.ticketsRemaining + ' Tickets Remaining');
			if (!initial && meetup.next && !rsvp.responded) this.animateRemaining(meetup.data.ticketsRemaining);
			
			this.$('.actions')[meetup.next ? 'removeClass' : 'addClass']('single');
			this.$('.meetup')[meetup.next ? 'removeClass' : 'addClass']('last');
		
		},
		
		addToCalendar: function() {
			
			if (!app._device.system || !app._device.system.match(/ios|android/)) {
				return app.showNotification('Alert', 'Sorry, calendar functionality can only be configured on actual devices.');
			}
			
			var meetup = app.data.meetups.next;
			
			if (!meetup) return;
			
			var starts = moment(meetup.starts).toDate(),
				ends = moment(meetup.ends).toDate();
			
			var title = 'HS Hackers' + (meetup.name ? ' - ' + meetup.name : ''),
				location = meetup.place,
				notes = meetup.description;
			
			var success = function() {
				app.showNotification('Added', 'The next meetup has been added to your calendar.');
			}
			
			var error = function() {
				app.showNotification('Not Added', 'The next meetup couldn\'t be added to your calendar.');
			}
			
			var reminders = {
				firstReminderMinutes: 60,
				secondReminderMinutes: null
			}
			
			window.plugins.calendar.createEventWithOptions(title, location, notes, starts, ends, reminders, success, error);
			
		},
		
		moveButtons: function(direction) {
		
			var $rsvp = $('.home .rsvp'),
				$left = $rsvp.find('.btn-left'),
				$right = $rsvp.find('.btn-right'),
				$divider = $rsvp.find('.divider');
			
			var left = 0,
				right = 0,
				divider = false,
				color = [255, 255, 255],
				leftText = '',
				rightText = '';
			
			var buttonSpacing = app.viewportSize.width / 4;
			
			switch(direction) {
				case 'left':
					left = buttonSpacing * 3;
					right = buttonSpacing;
					divider = buttonSpacing;
					color = [114, 240, 132];
					leftText = 'Attending';
				break;
				case 'middle':
					left = buttonSpacing * 2;
					right = buttonSpacing * 2;
					divider = 0;
					color = [96, 216, 255];
					leftText = 'Attending';
					rightText = 'Nope';
				break;
				case 'right':
					left = buttonSpacing;
					right = buttonSpacing * 3;
					divider = -(buttonSpacing);
					color = [241, 119, 99];
					rightText = 'I\'m not attending';
				break;
			}
			
			$divider.velocity({
				translateX: divider
			}, { easing: 'easeOutSine', duration: 400 });
			
			$left.velocity({
				width: left
			}, { duration: 400, easing: 'easeOutSine' });
			
			$right.velocity({
				width: right
			}, { duration: 400, easing: 'easeOutSine' });
			
			$rsvp.velocity({
				backgroundColorRed: color[0],
				backgroundColorGreen: color[1],
				backgroundColorBlue: color[2]
			}, { duration: 400, easing: 'easeOutSine' });
			
			var duration = 200,
				easing = 'easeOutSine';
			
			switch(direction) {
				case 'left':
					$left.data('button').disable();
					$right.data('button').enable();
					
					$left.find('.text').text(leftText).velocity({ opacity: 1 }, { duration: duration, easing: easing });
					$right.find('.text').velocity({ opacity: 0 }, { duration: duration, easing: easing });
					
					$left.find('.icon').velocity({ opacity: 0, rotateZ: '135deg' }, { duration: duration, easing: easing });
					$right.find('.icon').velocity({ opacity: 1, rotateZ: '-90deg' }, { delay: duration, duration: duration, easing: easing });
				break;
				case 'middle':
					$left.data('button').enable();
					$right.data('button').enable();
					
					$left.find('.text').text(leftText).velocity({ opacity: 1 }, { delay: duration, duration: duration, easing: easing });
					$right.find('.text').text(rightText).velocity({ opacity: 1 }, { delay: duration, duration: duration, easing: easing });
					
					$left.find('.icon').velocity({ opacity: 0, rotateZ: '135deg' }, { duration: duration, easing: easing });
					$right.find('.icon').velocity({ opacity: 0, rotateZ: '-135deg' }, { duration: duration, easing: easing });
				break;
				case 'right':
					$left.data('button').enable();
					$right.data('button').disable();
					
					$left.find('.text').velocity({ opacity: 0 }, { duration: duration, easing: easing });
					$right.find('.text').text(rightText).velocity({ opacity: 1 }, { duration: duration, easing: easing });
					
					$left.find('.icon').velocity({ opacity: 1, rotateZ: '90deg' }, { delay: duration, duration: duration, easing: easing });
					$right.find('.icon').velocity({ opacity: 0, rotateZ: '-135deg' }, { duration: duration, easing: easing });
				break;
			}
			
		},
		
		setState: function() {
			
			var self = this;
			
			var meetup = app.parseMeetup(),
				rsvp = app.data.rsvp;
			
			var $states = this.$('.states');
			
			var $rsvp = $states.find('.rsvp'),
				$soldOut = $states.find('.sold-out'),
				$soon = $states.find('.soon');
			
			$rsvp.hide();
			$soldOut.hide();
			$soon.hide();
			
			if (meetup.next && rsvp.responded && rsvp.attending) {
				$rsvp.show();
				this.moveButtons('left');
			} else if (meetup.next && rsvp.responded && !rsvp.attending) {
				$rsvp.show();
				this.moveButtons('right');
			} else if (meetup.next && meetup.data.ticketsRemaining) {
				$rsvp.show();
				this.moveButtons('middle');
			} else if (meetup.next && !meetup.data.ticketsRemaining) {
				$soldOut.show();
			} else {
				$soon.show();
			}
		},
		
		toggleAttending: function(options) {
			
			var self = this;
			
			if (self._processingForm) {
				console.log('[toggleAttending] - User tried to submit form but is already in a processing state.');
				return;
			}
			
			self._processingForm = true;
			
			var user = app.data.session;
			
			var rsvpData = {
				user: user.userId,
				meetup: app.data.meetups.next.id,
				attending: options.attending,
				cancel: options.cancel,
				changed: moment().toDate()
			};
			
			var success = function(data) {
				
				console.log("[toggleAttending] - RSVP successful.", data);
				
				// Set form to no longer processing (after 575 milliseconds of animations)
				setTimeout(function() {
					self._processingForm = false;
				}, 400);
				
			}
			
			var error = function(data) {
				
				console.log("[toggleAttending] - RSVP failed, advise user to retry.", data);
				
				// Reset RSVP state
				app.showLoadingSpinner();
				
				// Delay reseting the state so the animations take time to take effect gracefully
				setTimeout(function() {
				
					// Show message
					app.showNotification('Alert', 'Sorry, we couldn\'t mark your attendance, please try again.' + (data && data.message && data.message.length ? '\n\n' + data.message : ''));
					
					// Reset local cached data
					app.data.rsvp.responded = !app.data.rsvp.responded;
					app.data.rsvp.attending = !app.data.rsvp.attending;
					app.data.rsvp.date = false;
					
					// Update status
					self.setState();
					
					// Hide spinner
					app.hideLoadingSpinner();
					
					// Set form to no longer processing (after 575 milliseconds of animations)
					setTimeout(function() {
						self._processingForm = false;
					}, 400);
				
				}, 350);
				
			}
			
			$.ajax({
				url: app.getAPIEndpoint('rsvp'),
				type: 'post',
				data: rsvpData,
				dataType: 'json',
				cache: false,
				success: function(data) {
					return data.success ? success(data) : error(data);
				},
				error: function() {
					return error();
				}
			});
			
			// Determine state of RSVP
			var hasRSVPed = app.data.rsvp.responded,
				isAttending = app.data.rsvp.attending;
			
			if (hasRSVPed && isAttending && options.cancel) app.data.meetups.next.ticketsRemaining++;
			else if (!hasRSVPed && options.attending) app.data.meetups.next.ticketsRemaining--;
			
			// Update local cached data
			app.data.rsvp.responded = !options.cancel ? true : false;
			app.data.rsvp.attending = rsvpData.attending;
			app.data.rsvp.date = rsvpData.changed;
			
			// Update remaining
			this.animateRemaining(app.data.rsvp.responded);
			
			// Update status
			this.setState();
		
		},
		
		leftRSVP: function() {
			this.toggleRSVP('left');
		},
		
		rightRSVP: function() {
			this.toggleRSVP('right');
		},
		
		toggleRSVP: function(button) {
			
			if (_.isEmpty(app.data.session)) {
				var action = false;
				switch(button) {
					case 'left': if (!app.data.rsvp.responded) action = 'attending'; break;
					case 'right': if (!app.data.rsvp.responded) action = 'notAttending'; break;
				}
				app.view('home')._action = action;
				this.destroyBackground();
				app.view('signin').show('slide-up', true);
				return;
			}
			
			switch(button) {
				case 'left':
					if (app.data.rsvp.responded && !app.data.rsvp.attending) {
						this.rsvpCancel();
					} else if (!app.data.rsvp.responded) {
						this.rsvpAttending();
					}
				break;
				
				case 'right':
					if (app.data.rsvp.responded && app.data.rsvp.attending) {
						this.rsvpCancel();
					} else if (!app.data.rsvp.responded) {
						this.rsvpNotAttending();
					}
				break;
			}
			
		},
		
		rsvpAttending: function() {
			this.toggleAttending({ attending: true });
		},
		
		rsvpNotAttending: function() {
			this.toggleAttending({ attending: false });
		},
		
		rsvpCancel: function() {
			this.toggleAttending({ attending: false, cancel: true });
		},
		
		setSession: function() {
			this.$('.menu .btn-signout').hide();
			this.$('.menu .btn-join').hide();
			if (app.data.session.userId) {
				this.$('.menu .btn-signout').show();
			} else {
				this.$('.menu .btn-join').show();
			}
		},
		
		menuJoin: function() {
			
			this.destroyBackground();
			
			var matrixToArray = function(str) { return str.match(/(-?[0-9\.]+)/g); };
			var transformValue = _.last(matrixToArray(this.$('.menu .buttons').css('transform')));
			
			this.$('.menu .buttons').velocity({
				translateY: [-(this.$('.menu .buttons').height()), transformValue]
			}, { easing: 'easeOutSine', duration: 400 });
			
			app.view('signin').show('slide-up', true);
			
		},
		
		menuSignout: function() {
			app.signOut();
		},
		
		menuAbout: function() {
			this.menuView('about');
		},
		
		menuCredits: function() {
			this.menuView('credits');
		},
		
		menuAboutBack: function() {
			this.menuBack('about');
		},
		
		menuCreditsBack: function() {
			this.menuBack('credits');
		},
		
		menuView: function(view) {
			
			var self = this;
			
			var matrixToArray = function(str) { return str.match(/(-?[0-9\.]+)/g); };
			var transformValue = _.last(matrixToArray(this.$('.menu .buttons').css('transform')));
			
			this.$('.corners .btn-menu').velocity({ opacity: 0 }, { duration: 150, easing: 'easeOutSine' });
			
			this.$('.menu .buttons').velocity({
				translateY: [-(app.viewportSize.height), transformValue]
			}, { easing: 'easeOutSine', duration: 500 });
			
			this.$('.menu .' + view).show();
			
			var availableHeight = app.viewportSize.height -
				this.$('.statusbar').height() -
				this.$('.menu .' + view + ' .footer').height();
			
			this.$('.menu .' + view + ' .container').css({ height: availableHeight });
			this.$('.menu .' + view).css({ 'transform': 'translateY(' + app.viewportSize.height + 'px)' });
			this.$('.menu .' + view).velocity({
				translateY: [0, app.viewportSize.height],
			}, { easing: 'easeOutSine', duration: 500 });
			
			switch(view) {
				case 'about':
					this.$('.menu').velocity({ backgroundColorRed: 31, backgroundColorGreen: 199, backgroundColorBlue: 168 }, { easing: 'easeOutSine', duration: 500 });
					this.$('.menu .about .btn-plain').velocity({ backgroundColorRed: 26, backgroundColorGreen: 169, backgroundColorBlue: 143 }, { easing: 'easeOutSine', duration: 500 });
				break;
				case 'credits':
					this.$('.menu').velocity({ backgroundColorRed: 241, backgroundColorGreen: 119, backgroundColorBlue: 99 }, { easing: 'easeOutSine', duration: 500 });
					this.$('.menu .credits .btn-plain').velocity({ backgroundColorRed: 205, backgroundColorGreen: 101, backgroundColorBlue: 84 }, { easing: 'easeOutSine', duration: 500 });
					
					var images = this.$('.menu .credits .people li');
					
					images.find('.image').hide();
					
					setTimeout(function() {
						async.eachLimit(images, 1, function(image, animated) {
						
							$(image).find('.image').show().css('opacity', 0);
							$(image).find('.image').velocity({ opacity: 1 }, { duration: 200, easing: 'easeOutSine' });
							
							setTimeout(function() {
								return animated();
							}, 100);
						
						});
					}, 500);
				
				break;
			}
			
		},
		
		menuBack: function(view) {
			
			this.$('.menu').velocity({ backgroundColorRed: 38, backgroundColorGreen: 151, backgroundColorBlue: 222 }, { easing: 'easeOutSine', duration: 500 });
			this.$('.menu .' + view + ' .btn-plain').velocity({ backgroundColorRed: 32, backgroundColorGreen: 128, backgroundColorBlue: 189 }, { easing: 'easeOutSine', duration: 500 });
			
			this.$('.menu .' + view).velocity({
				translateY: app.viewportSize.height
			}, { easing: 'easeOutSine', duration: 500 });
			
			var availableHeight = app.viewportSize.height - this.$('.statusbar').height();
			
			var to = (availableHeight / 2) - (this.$('.buttons').height() / 2) + this.$('.statusbar').height();
			
			this.$('.menu .buttons').velocity({
				translateY: [to, -(app.viewportSize.height)]
			}, { easing: 'easeOutSine', duration: 500 });
			
			this.$('.corners .btn-menu').velocity({ opacity: 1 }, { delay: 300, duration: 150, easing: 'easeOutSine' });
			
			app.scrollContainer(this);
			
		},
		
		openLink: function(e) {
			if (app.inTransition()) return;
			window.open($(e.target).data().link, '_system');
		},
		
		easterEgg: function() {
			
			var $squid = this.$('.squid'),
				$logo = this.$('.btn-logo');
			
			if ($squid.is(':visible')) return;
			
			$squid.show();
			
			var logoPosition = $logo.offset(),
				logoParentPosition = $logo.parent().offset();
			
			var topOffset = logoPosition.top - logoParentPosition.top,
				leftOffset = logoPosition.left - logoParentPosition.left;
			
			var squidTopPosition = topOffset - $logo.height() + $squid.height(),
				squidLeftPosition = leftOffset + $logo.width() - $squid.width() + 1;
			
			$squid.css({
				top: squidTopPosition,
				left: squidLeftPosition
			});
			
			$squid.css('marginTop', -(topOffset) - $squid.height());
			
			$squid.velocity({
				marginTop: 60
			}, { easing: 'easeOutBounce', duration: 1000 });
			
		}
		
	});
	
})();
