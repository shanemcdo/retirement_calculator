export function getURL(): URL {
	return new URL(window.location.toString());
}

export function updateURL(newurl: URL) {
	const urlstring = newurl.toString();
	window.history.pushState({ path: urlstring },'',urlstring);
}

export function setURLParam(name: string, value: string) {
	if(value === '') {
		deleteURLParam(name);
		return;
	}
	const url = getURL();
	url.searchParams.set(name, value);
	updateURL(url);
}

export function deleteURLParam(name: string) {
	const url = getURL();
	url.searchParams.delete(name);
	updateURL(url);
}

export function getURLParam(name: string): string | null {
	const url = getURL();
	return url.searchParams.get(name);
}

