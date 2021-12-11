import * as joint from 'jointjs';

export class HtmlElement extends joint.dia.Element {
  override defaults() {
    return {
      ...super.defaults,
      type: 'html.Element',
      attrs: {
        rect: { stroke: 'none', 'fill-opacity': 0 },
      },
    };
  }
}

// export class HtmlElementView extends joint.dia.ElementView{
//   override initialize(){
//     super.initialize();
// Update the box position whenever the underlying model changes.
// this.model.on('change', this.updateBox, this);
// Remove the box when the model gets removed from the graph.
// this.model.on('remove', this.removeBox, this);

// }
// override render(): this {
//     super.render();
//     this.updateBox();
//     return this;
// }
// updateBox(){
//   if(this.model.prop.updateBoxCallback) this.model.prop.updateBoxCallback(this.model.getBBox());

// }
// removeBox(){
//   if(this.model.prop.removeBoxCallback) this.model.prop.removeBoxCallback();
// }
// }

// export class MyShape extends joint.dia.Element {
//   override defaults() {
//     return {
//       ...super.defaults,
//       type: 'html.Element',
//       attrs: {
//         rect: { stroke: 'none', 'fill-opacity': 0 },
//         body: {
//           // Attributes
//         },
//         label: {
//           // Attributes
//         },
//       },
//     };
//   }
//   override markup = [
//     {
//       tagName: 'ellipse',
//       selector: 'body',
//       height: 40,
//       width: 20,
//       style: {
//         fill: 'yellow',
//         stroke: 'purple',
//         strokeWidht: '2',
//       },
//       attribues: {
//         cx: '200',
//         cy: '80',
//         rx: '100',
//         ry: '50',
//       },
//       children: [
//         {
//           tagName: 'tspan',
//           selector: 'customSelector',
//           textContent: 'Test',
//         },
//       ],
//     },
//     {
//       tagName: 'text',
//       selector: 'label',
//       style: {
//         fill: 'red',
//       },
//     },
//   ];

//   test(): void {
//     console.log(`A prototype method test for ${this.get('type')}`);
//   }

//   static staticTest(i: number): void {
//     console.log(`A static method test with an argument: ${i}`);
//   }

//   setText(text: string): joint.dia.Element {
//     return this.attr('label/text', text || '');
//   }
// }

// const shapes: typeof joint.shapes & { html: any } = Object.assign(joint.shapes, {
//     html: {}
// });

// shapes.html.Element = joint.shapes.basic.Rect.extend({
//     defaults: joint.util.deepSupplement({
//         type: 'html.Element',
//         attrs: {
//             rect: { stroke: 'none', 'fill-opacity': 0 }
//         }
//     }, joint.shapes.basic.Rect.prototype.defaults)
// });

// // Create a custom view for that element that displays an HTML div above it.
// // -------------------------------------------------------------------------

// shapes.html.ElementView = joint.dia.ElementView.extend({

//     template: [
//         '<div class="html-element">',
//         '<button class="delete">x</button>',
//         '<label></label>',
//         '<span></span>', '<br/>',
//         '<select><option>--</option><option>one</option><option>two</option></select>',
//         '<input type="text" value="I\'m HTML input" />',
//         '</div>'
//     ].join(''),

//     initialize: function () {
//         _.bindAll(this, 'updateBox');
//         joint.dia.ElementView.prototype.initialize.apply(this, arguments);

//         this.$box = $(_.template(this.template)());
//         // Prevent paper from handling pointerdown.
//         this.$box.find('input,select').on('mousedown click', function (evt) {
//             evt.stopPropagation();
//         });
//         // This is an example of reacting on the input change and storing the input data in the cell model.
//         this.$box.find('input').on('change', _.bind(function (evt) {
//             this.model.prop.set('input', $(evt.target).val());
//         }, this));
//         this.$box.find('select').on('change', _.bind(function (evt) {
//             this.model.prop.set('select', $(evt.target).val());
//         }, this));
//         this.$box.find('select').val(this.model.prop.get('select'));
//         this.$box.find('.delete').on('click', _.bind(this.model.prop.remove, this.model));
//         // Update the box position whenever the underlying model changes.
//         this.model.prop.on('change', this.updateBox, this);
//         // Remove the box when the model gets removed from the graph.
//         this.model.prop.on('remove', this.removeBox, this);

//         this.updateBox();
//     },
//     render: function () {
//         joint.dia.ElementView.prototype.render.apply(this, arguments);
//         this.paper.$el.prepend(this.$box);
//         this.updateBox();
//         return this;
//     },
//     updateBox: function () {
//         // Set the position and dimension of the box so that it covers the JointJS element.
//         var bbox = this.model.prop.getBBox();
//         // Example of updating the HTML with a data stored in the cell model.
//         this.$box.find('label').text(this.model.prop.get('label'));
//         this.$box.find('span').text(this.model.prop.get('select'));
//         this.$box.css({
//             width: bbox.width,
//             height: bbox.height,
//             left: bbox.x,
//             top: bbox.y,
//             transform: 'rotate(' + (this.model.prop.get('angle') || 0) + 'deg)'
//         });
//     },
//     removeBox: function (evt) {
//         this.$box.remove();
//     }
// });

// // Create JointJS elements and add them to the graph as usual.
// // -----------------------------------------------------------

// var el1 = new joint.shapes.html.Element({
//     position: { x: 80, y: 80 },
//     size: { width: 170, height: 100 },
//     label: 'I am HTML',
//     select: 'one'
// });
