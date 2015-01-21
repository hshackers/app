;(function() {
	
	new View('signout', {
		
		on: {
			layout: function() {},
			visible: function() {
				
				this.animateView();
				
				// iOS: Change status bar style to match view style
				app.changeStatusBarStyle('black');
				
				// analytics
				app.trackEvent({ label: 'Signout', category: 'view', action: 'visible' });
				
			},
			hidden: function() {}
		},
		
		animateView: function() {
			
			var availableHeight = app.viewportSize.height;
			
			var position = (availableHeight / 2) - (this.$('.message').height() / 2);
			
			this.$('.message').css({
				opacity: 0,
				transform: 'translateY(' + position + 50 + 'px)'
			});
			
			this.$('.message').velocity({
				opacity: 1
			}, { duration: 500, easing: 'linear' });
			
			this.$('.message').velocity({
				translateY: [position - 50, position + 50],
			}, { duration: 2500, easing: 'linear', queue: false });
			
			setTimeout(function() {
				app.view('home').reveal('slide-up');
			}, 2500);
		
		}
		
	});

})();
