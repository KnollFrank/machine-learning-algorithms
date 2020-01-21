import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FilePickerComponent } from './file-picker/file-picker.component';
import { DatasetComponent } from './dataset/dataset.component';
import { DigitsComponent } from './digits/digits.component';
import { DigitComponent } from './digit/digit.component';
import { KnnBuilderComponent } from './knn-builder/knn-builder.component';
import { PredictionComponent } from './prediction/prediction.component';
import { FreeHandDrawingToolComponent } from './free-hand-drawing-tool/free-hand-drawing-tool.component';

@NgModule({
  declarations: [
    AppComponent,
    FilePickerComponent,
    DatasetComponent,
    DigitsComponent,
    DigitComponent,
    KnnBuilderComponent,
    PredictionComponent,
    FreeHandDrawingToolComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
