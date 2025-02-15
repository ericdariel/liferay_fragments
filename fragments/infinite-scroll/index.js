const editMode = document.body.classList.contains('has-edit-mode-menu');

if (!editMode) {
	const cardContainer = document.getElementById("card-container");
	const cardCountElem = document.getElementById("card-count");
	const cardTotalElem = document.getElementById("card-total");
	const loader = document.getElementById("loader");
	const cardIncrease = configuration.numberOfCards;
	const divToAddOnCard = configuration.divToAddOnCard;
	
	console.log("cardIncrease=" + cardIncrease)
	
	var cardLimit = 99;
	let pageCount = Math.ceil(cardLimit / cardIncrease);
	let currentPage = 1;

	cardTotalElem.innerHTML = cardLimit;

	const getRandomColor = () => {
		const h = Math.floor(Math.random() * 360);

		return `hsl(${h}deg, 80%, 80%)`;
	};

	const createCard = async (obj) => {
		let detailUrl = "/o/headless-delivery/v1.0/structured-contents/"
		  + obj.content.id 
		  + "/rendered-content/" + configuration.templateKey;
		
		console.log("urlDetail=" + detailUrl);
		
		await fetch(detailUrl,
			{
				method: "GET",
				cache: "no-cache",
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/json",
					"x-csrf-token": Liferay.authToken
				}
			}).then(async (rsp) => await rsp.text())
				.then(async (obj) => {
			      //console.log(obj);
			      const card = document.createElement("div");
		        card.className = divToAddOnCard;
		        const cardInner = document.createElement("div");
		        cardInner.className = "card";
		        cardInner.innerHTML = obj;
			      if (configuration.randomColor) {
		          cardInner.style.backgroundColor = getRandomColor();
		        }
					  card.appendChild(cardInner);
		        cardContainer.appendChild(card);
		  }).catch((err) => {
			   console.log("error=" + err);
		     const card = document.createElement("div");
		     card.className = divToAddOnCard;
		     const cardInner = document.createElement("div");
		     cardInner.className = "card";
		     cardInner.innerHTML = "<div><a href='/w/" + obj.content.friendlyUrlPath + "'>" + obj.title + "</a>" + obj.content.description + "</div>";
		     cardInner.style.backgroundColor = getRandomColor();
		     card.appendChild(cardInner);
		     cardContainer.appendChild(card);
		  });
	};

	const addCards = (pageIndex) => {
		currentPage = pageIndex;

		let url = "/o/headless-delivery/v1.0/sites/"
		  + Liferay.ThemeDisplay.getScopeGroupId()
		  + "/content-sets/by-key/" + configuration.collectionName 
		  + "/content-set-elements"
		  + "?page=" + currentPage 
			+ "&pageSize=" + cardIncrease;

		console.log("URL to call : " +  url);

		fetch(url,
			{
				method: "GET",
				cache: "no-cache",
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/json",
					"x-csrf-token": Liferay.authToken
				}
			}).then((rsp) => rsp.json())
				.then(async (obj) => {
					//console.log(obj);
					cardLimit = obj.totalCount;
					cardTotalElem.innerHTML = cardLimit;
					pageCount = Math.ceil(cardLimit / cardIncrease);

					let endRange =
				  currentPage == pageCount ? cardLimit : pageIndex * cardIncrease;
				  cardCountElem.innerHTML = endRange;
          
			    // WARN : DO NOT use foreach() to preserve order 
			    for (const item of obj.items) {
  			    await createCard(item);
			    }
			
					if (currentPage === pageCount) {
						removeInfiniteScroll();
					} else if (currentPage === 1) {
						observer.observe(document.querySelector('#card-total'));
					}
			}).catch((err) => {
			   console.log("error=" + err);
			   if (cardLimit == 99) {
			     cardTotalElem.innerHTML = 0;
				   pageCount = 1;
			     removeInfiniteScroll();
				 }
		  });
	};

	const onIntersection = (entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
		    setTimeout(() => {
				  addCards(currentPage + 1);
				}, 200);
								
				if (currentPage === pageCount) {
					removeInfiniteScroll();
				}
			}
		}
	};

	addCards(currentPage);
	
  const observer = new IntersectionObserver(onIntersection);
	
	const removeInfiniteScroll = () => {
		loader.remove();
		observer.unobserve(document.querySelector('#card-total'));
	};	
}