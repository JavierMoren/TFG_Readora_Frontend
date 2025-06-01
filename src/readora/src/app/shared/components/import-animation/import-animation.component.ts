import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-import-animation',
  templateUrl: './import-animation.component.html',
  styleUrls: ['./import-animation.component.css'],
  imports: [CommonModule]
})
export class ImportAnimationComponent implements OnInit, OnDestroy, OnChanges {
  @Input() bookTitle: string = '';
  @Input() isVisible: boolean = false;
  isDarkTheme: boolean = false;
  
  // Estados de la animación
  dotsLoading: string = '';
  currentStep: number = 1;
  
  private dotsInterval: any;
  private stepInterval: any;

  constructor(@Inject(ThemeService) private themeService: ThemeService) {
    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
    });
  }

  ngOnInit() {
    this.startDotsAnimation();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isVisible'] && changes['isVisible'].currentValue) {
      this.startProgressAnimation();
    } else if (changes['isVisible'] && !changes['isVisible'].currentValue) {
      this.resetAnimation();
    }
  }

  ngOnDestroy() {
    this.clearIntervals();
  }

  private startDotsAnimation() {
    let dotCount = 0;
    this.dotsInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      this.dotsLoading = '.'.repeat(dotCount);
    }, 500);
  }

  private startProgressAnimation() {
    this.currentStep = 1;
    
    // Paso 1: Descargando (0-500ms)
    setTimeout(() => {
      this.currentStep = 2; // Paso 2: Procesando (500-1000ms)
      setTimeout(() => {
        this.currentStep = 3; // Paso 3: Guardando (1000-1500ms)
      }, 500);
    }, 500);
  }

  private resetAnimation() {
    this.currentStep = 1;
    this.clearIntervals();
  }

  private clearIntervals() {
    if (this.dotsInterval) {
      clearInterval(this.dotsInterval);
    }
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
    }
  }
}
