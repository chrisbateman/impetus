Impetus.js
=========
Add momentum to anything. It's like iScroll, except not for scrolling. Supports mouse and touch events.

Check out the demos on the [home page](http://chrisbateman.github.io/impetus).

Impetus will probably never support anything other than simple momentum. If you need scrolling or touch carousels or anything like that, this probably isn't the tool you're looking for.


### Usage ###
```javascript
var myImpetus = new Impetus({
    source: myNode,
    update: function(x, y) {
        // whatever you want to do with the values
    }
});
```
You give it an area to listen to for touch or mouse events, and it gives you the `x` and `y` values with some momentum.

Impetus will register itself as an AMD module if it's available.


### Constructor Options ###
<table>
	<thead>
		<tr>
			<th></th>
			<th scope="col">Type</th>
			<th scope="col">Default</th>
			<th scope="col">Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th scope="row" align="left"><code>source</code></th>
			<td><code>HTMLElement</code>|<code>String</code></td>
			<td>document</td>
			<td>Element reference or query string for the target on which to listen for movement.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>update</code> (required)</th>
			<td><code>function(x, y)</code></td>
			<td>-</td>
			<td>This function will be called with the updated <var>x</var> and <var>y</var> values.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>multiplier</code></th>
			<td><code>Number</code></td>
			<td><code>1</code></td>
			<td>The relationship between the input and output values.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>friction</code></th>
			<td><code>Number</code></td>
			<td><code>0.92</code></td>
			<td>Rate at which values slow down after you let go.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>initialValues</code></th>
			<td><code>[Number, Number]</code></td>
			<td><code>[0, 0]</code></td>
			<td>Array of initial <var>x</var> and <var>y</var> values.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>boundX</code></th>
			<td><code>[Number, Number]</code></td>
			<td>-</td>
			<td>Array of low and high values. <var>x</var>-values will remain within these bounds.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>boundY</code></th>
			<td><code>[Number, Number]</code></td>
			<td>-</td>
			<td>Array of low and high values. <var>y</var>-values will remain within these bounds.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>bounce</code></th>
			<td><code>Boolean</code></td>
			<td><code>true</code></td>
			<td>Whether to stretch and rebound values when pulled outside the bounds.</td>
		</tr>
	</tbody>
</table>


### Methods ###
<table>
	<thead>
		<tr>
			<th></th>
			<th scope="col">Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th scope="row" align="left"><code>.pause()</code></th>
			<td>Disable movement processing.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>.resume()</code></th>
			<td>Re-enable movement processing.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>.setMultiplier( &lt;number&gt; )</code></th>
			<td>Adjust the <var>multiplier</var> in flight.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>.setValues( &lt;number&gt; , &lt;number&gt; )</code></th>
			<td>Adjust the current <var>x</var> and <var>y</var> output values.</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>.setBoundX( &lt;number[2]&gt; )</code></th>
			<td>Adjust the X bound</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>.setBoundY( &lt;number[2]&gt; )</code></th>
			<td>Adjust the Y bound</td>
		</tr>
		<tr>
			<th scope="row" align="left"><code>.destroy()</code></th>
			<td>
				This will remove the previous event listeners. Returns null so you can use it to destroy your variable if you wish, i.e. <code>instance = instance.destroy()</code>
			</td>
		</tr>
	</tbody>
</table>


### Browser Support ###
Chrome, Firefox, Safari, Opera, IE 9+, iOS, Android. Support for IE 8 can be achieved by adding a polyfill for `addEventListener`.

