#include <SoftwareSerial.h>

int pin = 2;
int prevState=0;

/**
 * minimalais signala garums milisekundes
 */
int minSignalLength = 20;

int newState = 0;
unsigned long newStateTime;

void setup()
{
    Serial.begin(9600);
    pinMode(pin, INPUT_PULLUP);
    prevState=digitalRead(pin);
    newState = prevState;
    newStateTime = millis();
}

void loop()
{
    int val = digitalRead(pin);

    /**
     * registre jauno statusu un laiku
     */
    if(newState != val){
      newState = val;
      newStateTime = millis();
    }

    /**
     * ja jaunais status noturejies ilgak par minSignalLength, 
     * pienjem statusu mainju
     */
    if (prevState != newState && (newStateTime + minSignalLength) < millis())
    {
        Serial.println(val);
        prevState = newState;
    }
    delay(10);
}
