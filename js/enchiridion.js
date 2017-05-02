document.enchiridion = document.enchiridion || {};
document.enchiridion.impress = {
	init: () => {
		let placeholders = [...document.getElementsByClassName('fragmentPlaceholder')];
		console.log(placeholders);
		placeholders.forEach(placeholder => {
			const _id = placeholder.dataset._id,
				dataType = placeholder.dataset.type;

			document.enchiridion.ajax.getFragment({fId: _id})
			.then(fragment => {
				console.log(fragment);
				document.enchiridion.fragmentLoader.getPlugin([dataType], fragment)
				.then(document.enchiridion.fragmentLoader.extractContent)
				.then(document.enchiridion.fragmentLoader.generateElements)
				.then(transferContainer => {
					placeholder.parentElement.replaceChild(transferContainer.element, placeholder);
				});
			})
			.catch(err => {
				console.warn(err)
			});

		});
	}
}
